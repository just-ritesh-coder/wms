import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

export default function PartyProducts() {
  const [products, setProducts] = useState([]);
  const { user } = useContext(AuthContext);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/party/products', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setProducts(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (user?.token) fetchProducts();
  }, [user]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>Products & Variants</h2>
      </div>

      <div className="grid gap-6">
        {products.map(product => (
          <div key={product._id} className="bg-white border rounded-sm shadow-sm p-6" style={{ borderColor: 'var(--color-border-main)' }}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 mb-4">
              <div>
                <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--color-primary-dark)' }}>{product.name}</h3>
                <p className="text-sm opacity-70">Base Unit: {product.unit}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {product.variants?.map(v => (
                  <span key={v._id} className="bg-gray-100 text-gray-800 text-sm px-3 py-1.5 rounded-sm border flex items-center gap-2" style={{ borderColor: 'var(--color-border-subtle)' }}>
                    {v.name} 
                  </span>
                ))}
                {(!product.variants || product.variants.length === 0) && (
                  <span className="text-sm italic opacity-50">No variants yet</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
