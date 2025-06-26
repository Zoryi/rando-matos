import { expect } from 'chai';
import Pack from '../../models/Pack.js';

describe('Pack Model', () => {
    describe('Constructor', () => {
        it('should create a pack and assign id and name', () => {
            const packData = { id: 'pack1', name: 'Summer Trip' };
            const pack = new Pack(packData);
            expect(pack.id).to.equal('pack1');
            expect(pack.name).to.equal('Summer Trip');
        });

        it('should handle missing optional fields (though id and name are typically required by services)', () => {
            // Test with only id
            const pack1 = new Pack({ id: 'packOnlyId' });
            expect(pack1.id).to.equal('packOnlyId');
            expect(pack1.name).to.be.undefined;

            // Test with only name
            const pack2 = new Pack({ name: 'PackOnlyName' });
            expect(pack2.id).to.be.undefined;
            expect(pack2.name).to.equal('PackOnlyName');

            // Test with empty object
            const pack3 = new Pack({});
            expect(pack3.id).to.be.undefined;
            expect(pack3.name).to.be.undefined;
        });
    });
});
