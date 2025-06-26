import { expect } from 'chai';
import Item from '../../models/Item.js';

describe('Item Model', () => {
    describe('Constructor', () => {
        it('should create an item with default values if only required fields are provided', () => {
            const itemData = { id: '1', name: 'Test Item', weight: 100 };
            const item = new Item(itemData);

            expect(item.id).to.equal('1');
            expect(item.name).to.equal('Test Item');
            expect(item.weight).to.equal(100);
            expect(item.brand).to.equal('');
            expect(item.category).to.equal('');
            expect(item.tags).to.deep.equal([]);
            expect(item.capacity).to.equal('');
            expect(item.imageUrl).to.equal('');
            expect(item.isConsumable).to.be.false;
            expect(item.packIds).to.deep.equal([]);
            expect(item.packed).to.be.false;
        });

        it('should correctly assign all provided values', () => {
            const itemData = {
                id: '2',
                name: 'Full Item',
                weight: 250,
                brand: 'BrandX',
                category: 'CategoryA',
                tags: ['tag1', 'tag2'],
                capacity: 'Large',
                imageUrl: 'http://example.com/image.png',
                isConsumable: true,
                packIds: ['pack1', 'pack2'],
                packed: true
            };
            const item = new Item(itemData);

            expect(item.id).to.equal('2');
            expect(item.name).to.equal('Full Item');
            expect(item.weight).to.equal(250);
            expect(item.brand).to.equal('BrandX');
            expect(item.category).to.equal('CategoryA');
            expect(item.tags).to.deep.equal(['tag1', 'tag2']);
            expect(item.capacity).to.equal('Large');
            expect(item.imageUrl).to.equal('http://example.com/image.png');
            expect(item.isConsumable).to.be.true;
            expect(item.packIds).to.deep.equal(['pack1', 'pack2']);
            expect(item.packed).to.be.true;
        });

        it('should parse weight to float, defaulting to 0 if invalid', () => {
            const item1 = new Item({ id: '3', name: 'Valid Weight', weight: '150.5' });
            expect(item1.weight).to.equal(150.5);

            const item2 = new Item({ id: '4', name: 'Invalid Weight', weight: 'abc' });
            expect(item2.weight).to.equal(0);

            const item3 = new Item({ id: '5', name: 'Missing Weight', weight: undefined });
            expect(item3.weight).to.equal(0);
        });

        it('should parse tags string to array, or keep array, or default to empty array', () => {
            const item1 = new Item({ id: '6', name: 'Tags String', weight: 10, tags: ' tagA , tagB  ' });
            expect(item1.tags).to.deep.equal(['tagA', 'tagB']);

            const item2 = new Item({ id: '7', name: 'Tags Array', weight: 10, tags: ['tagC', 'tagD'] });
            expect(item2.tags).to.deep.equal(['tagC', 'tagD']);

            const item3 = new Item({ id: '8', name: 'Tags Empty String', weight: 10, tags: '  ' });
            expect(item3.tags).to.deep.equal([]);

            const item4 = new Item({ id: '9', name: 'Tags Undefined', weight: 10, tags: undefined });
            expect(item4.tags).to.deep.equal([]);

            const item5 = new Item({ id: '10', name: 'Tags Null', weight: 10, tags: null });
            expect(item5.tags).to.deep.equal([]);
        });

        it('should handle boolean conversions for isConsumable and packed', () => {
            const item1 = new Item({ id: '11', name: 'Consumable True', weight: 10, isConsumable: true });
            expect(item1.isConsumable).to.be.true;

            const item2 = new Item({ id: '12', name: 'Consumable False', weight: 10, isConsumable: false });
            expect(item2.isConsumable).to.be.false;

            const item3 = new Item({ id: '13', name: 'Consumable String', weight: 10, isConsumable: 'true' }); // truthy string
            expect(item3.isConsumable).to.be.true;

            const item4 = new Item({ id: '14', name: 'Consumable Empty String', weight: 10, isConsumable: '' }); // falsy string
            expect(item4.isConsumable).to.be.false;

            const item5 = new Item({ id: '15', name: 'Packed True', weight: 10, packed: 1 }); // truthy number
            expect(item5.packed).to.be.true;

            const item6 = new Item({ id: '16', name: 'Packed False', weight: 10, packed: 0 }); // falsy number
            expect(item6.packed).to.be.false;
        });

        it('should ensure packIds is an array', () => {
            const item1 = new Item({ id: '17', name: 'PackIds Array', weight: 10, packIds: ['p1'] });
            expect(item1.packIds).to.deep.equal(['p1']);

            const item2 = new Item({ id: '18', name: 'PackIds Undefined', weight: 10, packIds: undefined });
            expect(item2.packIds).to.deep.equal([]);

            const item3 = new Item({ id: '19', name: 'PackIds Not Array', weight: 10, packIds: 'p1' }); // Should default to empty if not an array
            expect(item3.packIds).to.deep.equal([]);
        });
    });
});
