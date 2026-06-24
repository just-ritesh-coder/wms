import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const { user } = useContext(AuthContext);

  // Modal States
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', unit: 'pcs' });

  const [showVariantModal, setShowVariantModal] = useState(null); // stores product ID
  const [newVariant, setNewVariant] = useState({ name: '', reorderLevel: 10 });

  const [editProductModal, setEditProductModal] = useState(null);
  const [editVariantModal, setEditVariantModal] = useState(null);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/admin/products', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setProducts(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (user?.token) fetchProducts();
  }, [user]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/products', newProduct, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setShowProductModal(false);
      setNewProduct({ name: '', unit: 'pcs' });
      fetchProducts();
    } catch (err) { alert(err.response?.data?.error || 'Failed to add product'); }
  };

  const handleAddVariant = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/admin/products/${showVariantModal}/variants`, newVariant, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setShowVariantModal(null);
      setNewVariant({ name: '', reorderLevel: 10 });
      fetchProducts();
    } catch (err) { alert(err.response?.data?.error || 'Failed to add variant'); }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/products/${editProductModal._id}`, editProductModal, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setEditProductModal(null);
      fetchProducts();
    } catch (err) { alert(err.response?.data?.error || 'Failed to update product'); }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product and ALL its variants?')) return;
    try {
      await axios.delete(`/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchProducts();
    } catch (err) { alert(err.response?.data?.error || 'Failed to delete product'); }
  };

  const handleEditVariant = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/variants/${editVariantModal._id}`, editVariantModal, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setEditVariantModal(null);
      fetchProducts();
    } catch (err) { alert(err.response?.data?.error || 'Failed to update variant'); }
  };

  const handleDeleteVariant = async (id) => {
    if (!window.confirm('Are you sure you want to delete this variant?')) return;
    try {
      await axios.delete(`/api/admin/variants/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchProducts();
    } catch (err) { alert(err.response?.data?.error || 'Failed to delete variant'); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>Products & Variants</h2>
        <button 
          onClick={() => setShowProductModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-sm hover:opacity-90 transition-colors w-full sm:w-auto" 
          style={{ backgroundColor: 'var(--color-primary-dark)' }}
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="grid gap-6">
        {products.map(product => (
          <div key={product._id} className="bg-white border rounded-sm shadow-sm p-6" style={{ borderColor: 'var(--color-border-main)' }}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>{product.name}</h3>
                  <button onClick={() => setEditProductModal(product)} className="text-blue-600 hover:text-blue-800"><Edit2 size={14} /></button>
                  <button onClick={() => handleDeleteProduct(product._id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                </div>
                <p className="text-sm opacity-70">Base Unit: {product.unit}</p>
              </div>
              <button 
                onClick={() => setShowVariantModal(product._id)}
                className="text-xs font-bold px-3 py-1.5 border rounded-sm hover:bg-gray-50 transition-colors w-full sm:w-auto text-center"
                style={{ borderColor: 'var(--color-border-main)', color: 'var(--color-primary-dark)' }}
              >
                + Add Variant
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {product.variants?.map(v => (
                  <span key={v._id} className="bg-gray-100 text-gray-800 text-sm px-3 py-1.5 rounded-sm border flex items-center gap-2 group" style={{ borderColor: 'var(--color-border-subtle)' }}>
                    {v.name} 
                    <span className="text-[10px] font-bold opacity-50 bg-gray-200 px-1.5 py-0.5 rounded mr-1">Alert: {v.reorderLevel || 10}</span>
                    <button onClick={() => setEditVariantModal(v)} className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-800 transition-opacity"><Edit2 size={12} /></button>
                    <button onClick={() => handleDeleteVariant(v._id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"><Trash2 size={12} /></button>
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

      {/* Add Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg">Add New Product</h3>
              <button onClick={() => setShowProductModal(false)} className="hover:opacity-70"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddProduct} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name</label>
                <input type="text" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full p-2 border rounded-sm" placeholder="e.g. Tastino Basil Seeds 360ml" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Base Unit</label>
                <input type="text" required value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})} className="w-full p-2 border rounded-sm" placeholder="e.g. pcs, ctn, kg" />
              </div>
              <button type="submit" className="w-full py-2 mt-4 text-white font-medium rounded-sm" style={{ backgroundColor: 'var(--color-primary-dark)' }}>Save Product</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Variant Modal */}
      {showVariantModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg">Add Variant</h3>
              <button onClick={() => setShowVariantModal(null)} className="hover:opacity-70"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddVariant} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Variant Flavor / Name</label>
                <input type="text" required value={newVariant.name} onChange={e => setNewVariant({...newVariant, name: e.target.value})} className="w-full p-2 border rounded-sm" placeholder="e.g. Mango, Orange" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Low Stock Alert Level (Reorder Level)</label>
                <input type="number" required min="0" value={newVariant.reorderLevel} onChange={e => setNewVariant({...newVariant, reorderLevel: Number(e.target.value)})} className="w-full p-2 border rounded-sm" />
              </div>
              <button type="submit" className="w-full py-2 mt-4 text-white font-medium rounded-sm" style={{ backgroundColor: 'var(--color-primary-dark)' }}>Save Variant</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg">Edit Product</h3>
              <button onClick={() => setEditProductModal(null)} className="hover:opacity-70"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditProduct} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name</label>
                <input type="text" required value={editProductModal.name} onChange={e => setEditProductModal({...editProductModal, name: e.target.value})} className="w-full p-2 border rounded-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Base Unit</label>
                <input type="text" required value={editProductModal.unit} onChange={e => setEditProductModal({...editProductModal, unit: e.target.value})} className="w-full p-2 border rounded-sm" />
              </div>
              <button type="submit" className="w-full py-2 mt-4 text-white font-medium rounded-sm" style={{ backgroundColor: 'var(--color-primary-dark)' }}>Update Product</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Variant Modal */}
      {editVariantModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg">Edit Variant</h3>
              <button onClick={() => setEditVariantModal(null)} className="hover:opacity-70"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditVariant} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Variant Name</label>
                <input type="text" required value={editVariantModal.name} onChange={e => setEditVariantModal({...editVariantModal, name: e.target.value})} className="w-full p-2 border rounded-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reorder Level</label>
                <input type="number" required min="0" value={editVariantModal.reorderLevel} onChange={e => setEditVariantModal({...editVariantModal, reorderLevel: Number(e.target.value)})} className="w-full p-2 border rounded-sm" />
              </div>
              <button type="submit" className="w-full py-2 mt-4 text-white font-medium rounded-sm" style={{ backgroundColor: 'var(--color-primary-dark)' }}>Update Variant</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
