import http from 'http';

http.get('http://localhost:5000/api/products', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const products = JSON.parse(data);

    console.log('--- HOMEPAGE (ProductCatalog.jsx) FILTER TEST ---');
    const categoriesToTest = ['All', 'Oversized T-Shirts', 'Drop Shoulder T-Shirts', 'Polo T-Shirts', 'Shirts'];

    categoriesToTest.forEach(selectedCategory => {
      const filtered = products.filter((item) => {
        let matchesCategory = true;
        if (selectedCategory !== 'All') {
          const target = selectedCategory.trim().toLowerCase();
          const sub = (item.subcategory || '').trim().toLowerCase();
          const cat = (item.category || '').trim().toLowerCase();
          const name = (item.name || '').trim().toLowerCase();

          if (target === 'shirts' || target === 'linen shirts' || target === 'linen-shirts') {
            if (sub.includes('t-shirt') || sub.includes('tshirt') || cat.includes('t-shirt') || cat.includes('tshirt')) {
              matchesCategory = false;
            } else {
              matchesCategory = (
                sub.includes('shirt') ||
                cat.includes('shirt') ||
                name.includes('shirt')
              );
            }
          } else if (target.includes('oversized')) {
            matchesCategory = sub.includes('oversized') || name.includes('oversized');
          } else if (target.includes('drop shoulder') || target.includes('dropshoulder')) {
            matchesCategory = sub.includes('drop shoulder') || sub.includes('dropshoulder') || name.includes('drop shoulder') || name.includes('dropshoulder');
          } else if (target.includes('polo')) {
            matchesCategory = sub.includes('polo') || name.includes('polo');
          }
        }
        return matchesCategory;
      });
      console.log(`Homepage [Category: ${selectedCategory}]: ${filtered.length} products`);
      filtered.forEach(p => console.log(`   - ${p.name} (sub: ${p.subcategory})`));
    });

    console.log('\n--- DEDICATED CATEGORY PAGE (CategoryPage.jsx) FILTER TEST ---');
    const categoryPagesToTest = [
      { slug: 'shirts', name: 'Shirts' },
      { slug: 'oversized-t-shirts', name: 'Oversized T-Shirts' },
      { slug: 'drop-shoulder-t-shirts', name: 'Drop Shoulder T-Shirts' },
      { slug: 'polo-t-shirts', name: 'Polo T-Shirts' }
    ];

    categoryPagesToTest.forEach(({ slug, name: catName }) => {
      const catSlug = slug.toLowerCase();
      const cName = catName.toLowerCase();

      const filtered = products.filter((item) => {
        const sub = (item.subcategory || '').toLowerCase();
        const cat = (item.category || '').toLowerCase();
        const name = (item.name || '').toLowerCase();

        if (catSlug === 'shirts' || cName === 'shirts') {
          const isTShirt = (
            sub.includes('t-shirt') ||
            sub.includes('tshirt') ||
            cat.includes('t-shirt') ||
            cat.includes('tshirt') ||
            name.includes('t-shirt') ||
            name.includes('tshirt') ||
            name.includes(' tee') ||
            name.endsWith('tee') ||
            name.startsWith('tee ') ||
            sub.includes('drop shoulder') ||
            sub.includes('polo') ||
            sub.includes('oversized')
          );
          if (isTShirt) return false;
          return (
            sub.includes('shirt') ||
            cat.includes('shirt') ||
            name.includes('shirt')
          );
        }

        if (catSlug === 'oversized-t-shirts' || cName.includes('oversized')) {
          return (
            sub.includes('oversized') ||
            cat.includes('oversized') ||
            name.includes('oversized')
          );
        }

        if (catSlug === 'drop-shoulder-t-shirts' || cName.includes('drop shoulder')) {
          return (
            sub.includes('drop shoulder') ||
            sub.includes('drop-shoulder') ||
            cat.includes('drop shoulder') ||
            name.includes('drop shoulder') ||
            name.includes('drop-shoulder')
          );
        }

        if (catSlug === 'polo-t-shirts' || cName.includes('polo')) {
          return (
            sub.includes('polo') ||
            cat.includes('polo') ||
            name.includes('polo')
          );
        }
        return false;
      });

      console.log(`CategoryPage [/category/${slug}]: ${filtered.length} products`);
      filtered.forEach(p => console.log(`   - ${p.name} (sub: ${p.subcategory})`));
    });
  });
});
