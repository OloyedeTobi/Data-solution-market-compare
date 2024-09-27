import React, { useState } from 'react';
import './App.css';

const DATA_INCREMENT = 1; 
const VALIDITY_OPTIONS = [30, 60, 90]; 

const wholesalePlans = [
  { id: 1, price: 86000, data: 285, validity: 90 },
  { id: 2, price: 134375, data: 450, validity: 90 },
  { id: 3, price: 236500, data: 800, validity: 90 },
  { id: 4, price: 290000, data: 1024, validity: 90 },
  { id: 5, price: 285000, data: 1024, validity: 90 },
  { id: 6, price: 280000, data: 1024, validity: 90 },
  { id: 7, price: 275000, data: 1024, validity: 90 }
];

const airtelPlans = [
  { price: 1000, data: 1.2, validity: 30 },
  { price: 3000, data: 10, validity: 30 },
  { price: 5000, data: 18, validity: 30 },
  { price: 10000, data: 40, validity: 30 },
  { price: 30000, data: 240, validity: 30 },
  { price: 50000, data: 400, validity: 90 }
];

const App = () => {
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [isFixedValidity, setIsFixedValidity] = useState(false);
  const [results, setResults] = useState([]);
  const [filterType, setFilterType] = useState('');

  const handlePlanSelect = (e) => setSelectedPlanId(e.target.value);
  const handleValidityToggle = () => setIsFixedValidity(!isFixedValidity);
  const handleFilterChange = (e) => setFilterType(e.target.value);


  const handleGeneratePlans = () => {
    if (!selectedPlanId) return;
    const wholesalePlan = wholesalePlans.find(plan => plan.id === parseInt(selectedPlanId));
    if (!wholesalePlan) return;
    const customerPlans = calculateCustomerPlans(wholesalePlan, VALIDITY_OPTIONS, isFixedValidity, airtelPlans);
    setResults(customerPlans);
  };

  return (
    <div className="app-container">
      <h2 className="app-heading">Maximized Profit Data Plan Generator</h2>
      <label>Select Wholesale Plan: </label>
      <select value={selectedPlanId} onChange={handlePlanSelect}>
        <option value="">-- Select a plan --</option>
        {wholesalePlans.map(plan => (
          <option key={plan.id} value={plan.id}>
            {plan.data} GB for {plan.price.toLocaleString()} Naira (90 days)
          </option>
        ))}
      </select>
      <div>
        <label>
          <input type="checkbox" checked={isFixedValidity} onChange={handleValidityToggle} />
          Fixed Validity (90 days)
        </label>
      </div>
      <div>
        <label>Filter: </label>
        <select value={filterType} onChange={handleFilterChange}>
          <option value="">None</option>
          <option value="profit">Profit</option>
          <option value="plan">Plan</option>
        </select>
      </div>
      <button onClick={handleGeneratePlans} disabled={!selectedPlanId}>Generate Plans</button>
      {results.length > 0 && <ResultsTable results={results} isFixedValidity={isFixedValidity} filterType={filterType} />}
    </div>
  );
};

const calculateCustomerPlans = (wholesalePlan, validityOptions, isFixedValidity, marketPrices) => {
  const plans = [];
  const baseCostPerGB = wholesalePlan.price / wholesalePlan.data;

  const dataTransferCostPerGB = 50; 
  const profitMargin = 20; 
  for (let data = DATA_INCREMENT; data <= wholesalePlan.data; data += DATA_INCREMENT) {
    validityOptions.forEach((validity) => {
      const pricePerGB = isFixedValidity ? baseCostPerGB : baseCostPerGB * (validity / 90);
      const retailPrice = Math.ceil(pricePerGB * data);

      const minPrice = Math.ceil(wholesalePlan.price * (data / wholesalePlan.data)) + (data * dataTransferCostPerGB);
      const maxPrice = Math.ceil(minPrice * (1 + (profitMargin / 100)));

      // Find the market price based on the closest match in marketPrices
      const marketPlan = marketPrices.find(plan => plan.data === data && plan.validity === validity);
      const marketPrice = marketPlan ? marketPlan.price : 0; // Set to 0 if no market plan matches

      // Calculate price difference: positive means wholesale is cheaper, negative means market is cheaper
      const priceDifference = minPrice - marketPrice;

      // Ensure retailPrice is valid
      const adjustedRetailPrice = retailPrice > minPrice ? retailPrice : minPrice + 1;

      // Correct profit per sale calculation
      const profitPerSale = adjustedRetailPrice - minPrice;

      const profitAtMaxPrice = maxPrice - minPrice;
      const renewals = Math.floor(90 / validity);
      const totalProfitOverRenewals = profitPerSale * renewals;
      const totalProfitAtMaxPrice = profitAtMaxPrice * renewals;

      plans.push({
        retailPrice: adjustedRetailPrice,
        minPrice,
        maxPrice,
        marketPrice,             
        priceDifference,          
        profitPerSale,
        profitAtMaxPrice,
        data,
        validity,
        potentialRenewals: renewals,
        totalProfitOverRenewals,
        totalProfitAtMaxPrice
      });
    });
  }

  return plans;
};



const ResultsTable = ({ results, isFixedValidity, filterType }) => {
  const groupedResults = results.reduce((acc, plan) => {
    (acc[plan.validity] = acc[plan.validity] || []).push(plan);
    return acc;
  }, {});

  const filteredResults = filterType === 'profit'
    ? results.filter(plan => plan.profitPerSale > 0)
    : results;

  return (
    <div className="results-container">
      {Object.keys(groupedResults).map(validity => (
        <div key={validity}>
          <h3>{validity} Day Plans</h3>
          <table className="results-table">
            <thead>
              <tr>
                <th>Retail Price (Naira)</th>
                <th>Min Price (Naira)</th>
                <th>Max Price (Naira)</th>
                <th>Market Price (Naira)</th> 
                <th>Price Difference (Naira)</th>  
                <th>Data (GB)</th>
                <th>Profit per Sale (Naira)</th>
                <th>Profit at Max Price (Naira)</th>
                {!isFixedValidity && <th>Potential Renewals</th>}
                {!isFixedValidity && <th>Total Profit Over 90 Days (Naira)</th>}
                {!isFixedValidity && <th>Total Profit at Max Price Over 90 Days (Naira)</th>}
              </tr>
            </thead>
            <tbody>
              {filteredResults.filter(result => result.validity === parseInt(validity)).map((plan, index) => (
                <tr key={index} className={plan.priceDifference < 0 ? 'loss' : 'profit'}>
                  <td>{plan.retailPrice}</td>
                  <td>{plan.minPrice}</td>
                  <td>{plan.maxPrice}</td>
                  <td>{plan.marketPrice}</td> 
                  <td>{plan.priceDifference}</td> 
                  <td>{plan.data}</td>
                  <td>{plan.profitPerSale}</td>
                  <td>{plan.profitAtMaxPrice}</td>
                  {!isFixedValidity && <td>{plan.potentialRenewals}</td>}
                  {!isFixedValidity && <td>{plan.totalProfitOverRenewals}</td>}
                  {!isFixedValidity && <td>{plan.totalProfitAtMaxPrice}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};


export default App;
