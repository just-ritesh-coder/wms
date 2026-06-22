import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('/api/admin/products', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setProducts(res.data);
      } catch (err) { console.error(err); }
    };
    if (user?.token) fetchProducts();
  }, [user]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>Products & Variants</h2>
      </div>

      <div className="grid gap-6">
        {products.map(product => (
          <div key={product._id} className="bg-white border rounded-sm shadow-sm p-6" style={{ borderColor: 'var(--color-border-main)' }}>
            <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--color-primary-dark)' }}>{product.name}</h3>
            <p className="text-sm opacity-70 mb-4">Base Unit: {product.unit}</p>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Variants:</h4>
              <div className="flex flex-wrap gap-2">
                {product.variants?.map(v => (
                  <span key={v._id} className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-sm border" style={{ borderColor: 'var(--color-border-subtle)' }}>
                    {v.name}
                  </span>
                ))}
                {(!product.variants || product.variants.length === 0) && (
                  <span className="text-sm italic opacity-50">No variants</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
