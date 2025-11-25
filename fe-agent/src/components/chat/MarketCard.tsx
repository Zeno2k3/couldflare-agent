import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { chatApi } from '../../services/api';

interface MarketData {
 id: string;
 symbol: string;
 name: string;
 price: number;
 change_24h: number;
}

export const MarketCard: React.FC = () => {
 const [data, setData] = useState<MarketData[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  const fetchData = async () => {
   try {
    const response = await chatApi.getMarketData();
    if (response.data.data) {
     setData(response.data.data);
    }
   } catch (error) {
    console.error('Failed to fetch market data:', error);
   } finally {
    setLoading(false);
   }
  };

  fetchData();
 }, []);

 if (loading) {
  return (
   <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm flex justify-center items-center">
    <Loader2 className="animate-spin text-blue-600" size={24} />
   </div>
  );
 }

 return (
  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
   <div className="flex items-center gap-2 mb-4">
    <TrendingUp size={18} className="text-blue-600" />
    <h3 className="font-semibold text-gray-800">Market Overview</h3>
   </div>
   <div className="grid grid-cols-1 gap-3">
    {data.map((item) => (
     <div key={item.id} className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
      <div className="flex justify-between items-start mb-1">
       <span className="text-sm font-medium text-gray-900">{item.name}</span>
       <span className="text-xs font-medium text-gray-500">{item.symbol}</span>
      </div>
      <div className="flex justify-between items-end">
       <div className="font-bold text-gray-900">${item.price.toLocaleString()}</div>
       <div className={`text-xs font-medium flex items-center gap-1 ${item.change_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {item.change_24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {Math.abs(item.change_24h).toFixed(2)}%
       </div>
      </div>
     </div>
    ))}
    {data.length === 0 && (
     <div className="text-center text-gray-500 text-sm py-4">
      No market data available
     </div>
    )}
   </div>
  </div>
 );
};
