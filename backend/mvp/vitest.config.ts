import {defineConfig} from 'vitest/config';
export default defineConfig({test:{pool:'threads',fileParallelism:false,globalSetup:['./test/prepare.ts'],setupFiles:['./test/setup.ts'],env:{DATABASE_URL:process.env.TEST_DATABASE_URL??'postgres://platemate:platemate@localhost:5433/platemate_test',JWT_SECRET:'test-only-secret-not-for-production-0123456789'},coverage:{provider:'v8',include:['src/services/**/*.ts','src/config.ts'],thresholds:{'src/services/booking.ts':{100:true},'src/services/scoring.ts':{100:true},lines:80,branches:80,functions:80,statements:80}}}});



