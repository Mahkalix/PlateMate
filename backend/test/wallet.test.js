import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { processWithdrawal } from '../src/wallet.js';

test('retrait idempotent : transfert enregistré, versement différé tant que les fonds Stripe ne sont pas disponibles', async () => {
  let transferId=null,payoutId=null,available=0,transferCalls=0,payoutCalls=0;
  const pool={ query:async(sql)=>{
    if(sql.includes('SELECT p.*,a.stripe_account_id')) return {rows:[{ id:'withdrawal',attempt:1,amount_cents:2800,stripe_account_id:'acct_host',stripe_payout_id:payoutId }]};
    if(sql.includes('SELECT w.booking_id')) return {rows:[{booking_id:'booking',amount_cents:2800,stripe_transfer_id:transferId,stripe_charge_id:'ch_paid'}]};
    if(sql.includes('UPDATE wallet_entries SET stripe_transfer_id')) {transferId='tr_one';return {rowCount:1};}
    if(sql.includes('UPDATE wallet_payouts SET stripe_payout_id')) {payoutId='po_one';return {rowCount:1};}
    throw Error(sql);
  }};
  const stripe={accounts:{retrieve:async()=>({payouts_enabled:true,capabilities:{transfers:'active'}})},transfers:{create:async()=>{transferCalls++;return {id:'tr_one'};}},balance:{retrieve:async()=>({available:[{currency:'eur',amount:available}]})},payouts:{create:async()=>{payoutCalls++;return {id:'po_one'};}}};
  assert.equal((await processWithdrawal(pool,stripe,'withdrawal','host')).awaitingFunds,true);
  assert.equal(transferCalls,1);
  assert.equal(payoutCalls,0);
  available=2800;
  assert.equal((await processWithdrawal(pool,stripe,'withdrawal','host')).state,'processing');
  assert.equal(transferCalls,1);
  assert.equal(payoutCalls,1);
  await processWithdrawal(pool,stripe,'withdrawal','host');
  assert.equal(payoutCalls,1);
});
