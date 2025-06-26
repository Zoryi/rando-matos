import Pack from '../../models/Pack.js';

describe('Pack Model', () => {
    describe('Constructor', () => {
        it('should create a pack and assign id and name', () => {
            const packData = { id: 'pack1', name: 'Summer Trip' };
            const pack = new Pack(packData);
            expect(pack.id).toBe('pack1');
            expect(pack.name).toBe('Summer Trip');
        });

        it('should handle missing optional fields (though id and name are typically required by services)', () => {
            // Test with only id
            const pack1 = new Pack({ id: 'packOnlyId' });
            expect(pack1.id).toBe('packOnlyId');
            expect(pack1.name).toBeUndefined();

            // Test with only name
            const pack2 = new Pack({ name: 'PackOnlyName' });
            expect(pack2.id).toBeUndefined();
            expect(pack2.name).toBe('PackOnlyName');

            // Test with empty object
            const pack3 = new Pack({});
            expect(pack3.id).toBeUndefined();
            expect(pack3.name).toBeUndefined();
        });
    });
});
