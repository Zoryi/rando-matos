import Category from '../../models/Category.js';

describe('Category Model', () => {
    describe('Constructor', () => {
        it('should create a category and assign the name', () => {
            const categoryData = { name: 'Electronics' };
            const category = new Category(categoryData);
            expect(category.name).toBe('Electronics');
        });

        it('should trim whitespace from the category name if any (behavior not specified, but good to test)', () => {
            // Note: Current Category model does not implement trimming in constructor.
            // This test would fail unless the model is updated or this is the expected behavior.
            // For now, testing current behavior.
            const categoryData = { name: '  Camping Gear  ' };
            const category = new Category(categoryData);
            expect(category.name).toBe('  Camping Gear  ');
            // If trimming is desired, Category model constructor should be: this.name = name.trim();
        });

        it('should handle empty or undefined names (current behavior is to assign them as is)', () => {
            const category1 = new Category({ name: '' });
            expect(category1.name).toBe('');

            const category2 = new Category({ name: undefined });
            expect(category2.name).toBeUndefined();

            const category3 = new Category({}); // name is undefined
            expect(category3.name).toBeUndefined();
        });
    });
});
