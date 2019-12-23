describe('testing agent-jest', () => {
    let vals;
    let sum_of_vals;
    let pos_vals;
    let neg_vals;

    beforeAll(() => {
        pos_vals = [1, 2, 3, 4];
        neg_vals = [-1, -2, -3];
        vals = pos_vals.concat(neg_vals);
        sum_of_vals = vals.reduce((x, y) => x + y, 0);
    })

    test('the sum of vals should be 4', () => {
        expect(sum_of_vals).toBe(4);
    });

    test('the positive\'s length should equal negative\'s length, should be failed', () => {
        expect(pos_vals.length).toEqual(neg_vals.length);
    });

    test.skip('the positive\'s length should equal negative\'s length, should be skipped', () => {
        expect(pos_vals.length).toEqual(neg_vals.length);
    });
});