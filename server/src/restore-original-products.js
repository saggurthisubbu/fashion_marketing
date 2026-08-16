import 'dotenv/config';
import { connectDB } from './config/db.js';
import { Product } from './models/Product.js';

async function restore() {
  await connectDB();

  const originalMappings = [
    {
      id: '6a787084064f3fe43dff772a',
      images: {
        front: '/uploads/quickfit-front-1786278020242-643185972.jpg',
        back: '/uploads/quickfit-back-1786278020259-287637838.jpg',
        left: '/uploads/quickfit-left-1786278020270-838582305.jpg',
        right: '/uploads/quickfit-right-1786278020278-893905578.jpg'
      }
    },
    {
      id: '6a79c3ddcf005fbb86a59856',
      images: {
        front: '/uploads/quickfit-product-1-front-1786364892855-32486295.jpg',
        back: '/uploads/quickfit-product-1-back-1786364892884-678221107.jpg',
        left: '/uploads/quickfit-product-1-left-1786364892903-905232580.jpg',
        right: '/uploads/quickfit-product-1-right-1786364892925-657336460.jpg'
      }
    },
    {
      id: '6a79c42dcf005fbb86a59896',
      images: {
        front: '/uploads/quickfit-product-2-front-1786364973624-7549561.jpg',
        back: '/uploads/quickfit-product-2-back-1786364973648-620345618.jpg',
        left: '/uploads/quickfit-product-2--left-1786364973686-387755528.jpg',
        right: '/uploads/quickfit-product-2-right-1786364973666-883169471.jpg'
      }
    },
    {
      id: '6a79c471cf005fbb86a598d6',
      images: {
        front: '/uploads/quickfit-product-3-front-1786365041366-770014914.jpg',
        back: '/uploads/quickfit-product-3-back-1786365041384-279098258.jpg',
        left: '/uploads/quickfit-product-3-left-1786365041404-937744194.jpg',
        right: '/uploads/quickfit-product-3-right-1786365041421-887854258.jpg'
      }
    },
    {
      id: '6a79c4b7cf005fbb86a59916',
      images: {
        front: '/uploads/quickfit-product-4-front-1786365110943-222665449.jpg',
        back: '/uploads/quickfit-product-4-back-1786365110959-681858594.jpg',
        left: '/uploads/quickfit-product-4-left-1786365110976-821730169.jpg',
        right: '/uploads/quickfit-product-4-right-1786365110994-403162492.jpg'
      }
    },
    {
      id: '6a79c4ffcf005fbb86a59956',
      images: {
        front: '/uploads/quickfit-product-5-front-1786365182734-949148927.jpg',
        back: '/uploads/quickfit-product-5-back-1786365182753-272502638.jpg',
        left: '/uploads/quickfit-product-5-left-1786365182786-91941946.jpg',
        right: '/uploads/quickfit-product-5-right-1786365182769-639414797.jpg'
      }
    },
    {
      id: '6a79c53dcf005fbb86a59996',
      images: {
        front: '/uploads/quickfit-product-6-front-1786365244742-803797421.jpg',
        back: '/uploads/quickfit-product-6-back-1786365244760-945034643.jpg',
        left: '/uploads/quickfit-product-6-left-1786365244777-976023289.jpg',
        right: '/uploads/quickfit-product-6-right-1786365244795-542737426.jpg'
      }
    },
    {
      id: '6a79cc6a9f0cfd9d545cc764',
      images: {
        front: '/uploads/quickfit-product-7-front-1786367082282-243255965.jpg',
        back: '/uploads/quickfit-product-7-back-1786367082314-966978977.jpg',
        left: '/uploads/quickfit-product-7-left-1786367082333-672692823.jpg',
        right: '/uploads/quickfit-product-7-right-1786367082352-186981136.jpg'
      }
    },
    {
      id: '6a79d49ad5dc109d3ee97453',
      images: {
        front: '/uploads/quickfit-polo-t-shirts-1-front-1786369177869-286899166.jpg',
        back: '/uploads/quickfit-polo-t-shirts-1-back-1786369177893-279196966.jpg',
        left: '/uploads/quickfit-polo-t-shirts-1-left-1786369177912-54773569.jpg',
        right: '/uploads/quickfit-polo-t-shirts-1-r-1786369177928-989217484.jpg'
      }
    },
    {
      id: '6a79d4ead5dc109d3ee9747b',
      images: {
        front: '/uploads/quickfit-polo-t-shirts-2-f-1786369258299-353206166.jpg',
        back: '/uploads/quickfit-polo-t-shirts-2-b-1786369258283-867649163.jpg',
        left: '/uploads/quickfit-polo-t-shirts-2-l-1786369258266-586519169.jpg',
        right: '/uploads/quickfit-polo-t-shirts-2-r-1786369258317-553869610.jpg'
      }
    },
    {
      id: '6a79d52ad5dc109d3ee974cb',
      images: {
        front: '/uploads/quickfit-polo-t-shirts-3-f-1786369322642-710835860.jpg',
        back: '/uploads/quickfit-polo-t-shirts-3-b-1786369322659-474765808.jpg',
        left: '/uploads/quickfit-polo-t-shirts-3-l-1786369322678-278166717.jpg',
        right: '/uploads/quickfit-polo-t-shirts-3-r-1786369322693-328552773.jpg'
      }
    },
    {
      id: '6a79d559d5dc109d3ee974f3',
      images: {
        front: '/uploads/quickfit-polo-t-shirts-4-f-1786369369347-266381781.jpg',
        back: '/uploads/quickfit-polo-t-shirts-4-b-1786369369361-262672105.jpg',
        left: '/uploads/quickfit-polo-t-shirts-4-l-1786369369393-622923881.jpg',
        right: '/uploads/quickfit-polo-t-shirts-4-r-1786369369377-612241579.jpg'
      }
    },
    {
      id: '6a79d589d5dc109d3ee9751b',
      images: {
        front: '/uploads/quickfit-polo-t-shirts-5--r-1786369417065-961315866.jpg',
        back: '/uploads/quickfit-polo-t-shirts-5-b-1786369417082-604426498.jpg',
        left: '/uploads/quickfit-polo-t-shirts-5-l-1786369417098-889957256.jpg',
        right: '/uploads/quickfit-polo-t-shirts-5--r-1786369417065-961315866.jpg'
      }
    },
    {
      id: '6a79d5b7d5dc109d3ee97543',
      images: {
        front: '/uploads/quickfit-polo-t-shirts-6-f-1786369463302-937021564.jpg',
        back: '/uploads/quickfit-polo-t-shirts-6-b-1786369463316-1749640.jpg',
        left: '/uploads/quickfit-polo-t-shirts-6-l-1786369463331-57841525.jpg',
        right: '/uploads/quickfit-polo-t-shirts-6-r-1786369463349-101827035.jpg'
      }
    },
    {
      id: '6a79d5e4d5dc109d3ee9756b',
      images: {
        front: '/uploads/quickfit-polo-t-shirts-7-f-1786369507816-177675632.jpg',
        back: '/uploads/quickfit-polo-t-shirts-7-b-1786369507830-948724243.jpg',
        left: '/uploads/quickfit-polo-t-shirts-7-l-1786369507845-798261413.jpg',
        right: '/uploads/quickfit-polo-t-shirts-7-r-1786369507860-93841928.jpg'
      }
    },
    {
      id: '6a79d608d5dc109d3ee97593',
      images: {
        front: '/uploads/quickfit-polo-t-shirts-8-f-1786369543837-582655937.jpg',
        back: '/uploads/quickfit-polo-t-shirts-8-b-1786369543852-173078731.jpg',
        left: '/uploads/quickfit-polo-t-shirts-8-l-1786369543869-802682811.jpg',
        right: '/uploads/quickfit-polo-t-shirts-8-r-1786369543884-804593822.jpg'
      }
    }
  ];

  let count = 0;
  for (const item of originalMappings) {
    const prod = await Product.findById(item.id);
    if (prod) {
      prod.images = item.images;
      prod.image = item.images.front;
      prod.gallery = [item.images.front, item.images.back, item.images.left, item.images.right].filter(Boolean);
      await prod.save();
      count++;
      console.log(`[RESTORED] ${prod.name} (${prod._id}) -> ${prod.image}`);
    }
  }

  console.log(`\n🎉 Successfully restored original image data for ${count} products in MongoDB Atlas!`);
  process.exit(0);
}

restore().catch(err => {
  console.error('Restore Error:', err);
  process.exit(1);
});
