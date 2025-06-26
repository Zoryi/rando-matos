import Item from '../../models/Item.js';

describe('Item Model', () => {
    describe('Constructor', () => {
        it('should create an item with default values if only required fields are provided', () => {
            const itemData = { id: '1', name: 'Test Item', weight: 100 };
            const item = new Item(itemData);

            expect(item.id).toBe('1');
            expect(item.name).toBe('Test Item');
            expect(item.weight).toBe(100);
            expect(item.brand).toBe('');
            expect(item.category).toBe('');
            expect(item.tags).toEqual([]);
            expect(item.capacity).toBe('');
            expect(item.imageUrl).toBe('');
            expect(item.isConsumable).toBe(false);
            expect(item.packIds).toEqual([]);
            expect(item.packed).toBe(false);
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

            expect(item.id).toBe('2');
            expect(item.name).toBe('Full Item');
            expect(item.weight).toBe(250);
            expect(item.brand).toBe('BrandX');
            expect(item.category).toBe('CategoryA');
            expect(item.tags).toEqual(['tag1', 'tag2']);
            expect(item.capacity).toBe('Large');
            expect(item.imageUrl).toBe('http://example.com/image.png');
            expect(item.isConsumable).toBe(true);
            expect(item.packIds).toEqual(['pack1', 'pack2']);
            expect(item.packed).toBe(true);
        });

        it('should parse weight to float, defaulting to 0 if invalid', () => {
            const item1 = new Item({ id: '3', name: 'Valid Weight', weight: '150.5' });
            expect(item1.weight).toBe(150.5);

            const item2 = new Item({ id: '4', name: 'Invalid Weight', weight: 'abc' });
            expect(item2.weight).toBe(0);

            const item3 = new Item({ id: '5', name: 'Missing Weight', weight: undefined });
            expect(item3.weight).toBe(0);
        });

        it('should parse tags string to array, or keep array, or default to empty array', () => {
            const item1 = new Item({ id: '6', name: 'Tags String', weight: 10, tags: ' tagA , tagB  ' });
            expect(item1.tags).toEqual(['tagA', 'tagB']);

            const item2 = new Item({ id: '7', name: 'Tags Array', weight: 10, tags: ['tagC', 'tagD'] });
            expect(item2.tags).toEqual(['tagC', 'tagD']);

            const item3 = new Item({ id: '8', name: 'Tags Empty String', weight: 10, tags: '  ' });
            expect(item3.tags).toEqual([]);

            const item4 = new Item({ id: '9', name: 'Tags Undefined', weight: 10, tags: undefined });
            expect(item4.tags).toEqual([]);

            const item5 = new Item({ id: '10', name: 'Tags Null', weight: 10, tags: null });
            expect(item5.tags).toEqual([]);
        });

        it('should handle boolean conversions for isConsumable and packed', () => {
            const item1 = new Item({ id: '11', name: 'Consumable True', weight: 10, isConsumable: true });
            expect(item1.isConsumable).toBe(true);

            const item2 = new Item({ id: '12', name: 'Consumable False', weight: 10, isConsumable: false });
            expect(item2.isConsumable).toBe(false);

            const item3 = new Item({ id: '13', name: 'Consumable String', weight: 10, isConsumable: 'true' }); // truthy string
            expect(item3.isConsumable).toBe(true);

            const item4 = new Item({ id: '14', name: 'Consumable Empty String', weight: 10, isConsumable: '' }); // falsy string
            expect(item4.isConsumable).toBe(false);

            const item5 = new Item({ id: '15', name: 'Packed True', weight: 10, packed: 1 }); // truthy number
            expect(item5.packed).toBe(true);

            const item6 = new Item({ id: '16', name: 'Packed False', weight: 10, packed: 0 }); // falsy number
            expect(item6.packed).toBe(false);
        });

        it('should ensure packIds is an array', () => {
            const item1 = new Item({ id: '17', name: 'PackIds Array', weight: 10, packIds: ['p1'] });
            expect(item1.packIds).toEqual(['p1']);

            const item2 = new Item({ id: '18', name: 'PackIds Undefined', weight: 10, packIds: undefined });
            expect(item2.packIds).toEqual([]);

            const item3 = new Item({ id: '19', name: 'PackIds Not Array', weight: 10, packIds: 'p1' }); // Should default to empty if not an array
            expect(item3.packIds).toEqual([]);
        });
    });
});
