// Test file using an unsupported test framework (Tape)
import test from 'tape';

test('unsupported framework test', (t) => {
  t.plan(1);

  t.equal(1 + 1, 2, 'should add numbers');
  t.end();
});

test('another unsupported test', (t) => {
  t.plan(1);

  t.ok(true, 'should pass');
  t.end();
});
