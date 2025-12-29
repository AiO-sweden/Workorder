import React, { useState } from 'react';
import { supabase } from '../supabase/config';
import './ArticlePicker.css';

const ArticlePicker = ({ onSelectArticle, onClose }) => {
    const [articles, setArticles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState('Alla');
    const [selectedCategory, setSelectedCategory] = useState('Alla');
    const [suppliers] = useState(['Alla', 'Solar', 'Dahl', 'Egen']);
    const [categories, setCategories] = useState(['Alla']);
    const [isLoading, setIsLoading] = useState(false);
    const [searchMessage, setSearchMessage] = useState('');

    const handleSearch = async () => {
        if (!searchTerm || searchTerm.length < 2) {
            alert('Skriv minst 2 tecken för att söka');
            return;
        }

        setIsLoading(true);
        setSearchMessage('Söker...');

        try {
            const searchLower = searchTerm.toLowerCase();

            // Build query
            let query = supabase
                .from('articles')
                .select('*')
                .limit(2000);

            // Om leverantör är vald, filtrera på den
            if (selectedSupplier !== 'Alla') {
                query = query.eq('supplier', selectedSupplier);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Convert from snake_case to camelCase
            let allArticles = (data || []).map(article => ({
                id: article.id,
                articleNumber: article.article_number,
                name: article.name,
                rskNumber: article.rsk_number,
                supplier: article.supplier,
                category: article.category,
                unit: article.unit,
                price: article.price,
                purchasePrice: article.purchase_price,
                lastUpdated: article.last_updated
            }));

            // Filtrera på klientsidan - söker i namn, artikelnummer OCH RSK-nummer
            let filtered = allArticles.filter(article => {
                const matchName = article.name && article.name.toLowerCase().includes(searchLower);
                const matchArticleNumber = article.articleNumber && article.articleNumber.toLowerCase().includes(searchLower);
                const matchRSK = article.rskNumber && article.rskNumber.toLowerCase().includes(searchLower);

                return matchName || matchArticleNumber || matchRSK;
            });

            // Filtrera på kategori om vald
            if (selectedCategory !== 'Alla') {
                filtered = filtered.filter(article => article.category === selectedCategory);
            }

            // Sortera alfabetiskt
            filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

            setArticles(filtered);

            // Uppdatera tillgängliga kategorier
            const uniqueCategories = ['Alla', ...new Set(filtered.map(a => a.category).filter(Boolean))];
            setCategories(uniqueCategories);

            setSearchMessage(filtered.length > 0
                ? `Hittade ${filtered.length} artiklar`
                : 'Inga artiklar hittades'
            );

        } catch (error) {
            console.error("Error searching articles: ", error);
            setSearchMessage('Ett fel uppstod vid sökning');
            alert("Kunde inte söka artiklar: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleSupplierChange = (value) => {
        setSelectedSupplier(value);
        // Rensa kategori när leverantör ändras
        setSelectedCategory('Alla');
    };

    const handleSelectArticle = (article) => {
        onSelectArticle({
            articleId: article.id,
            articleNumber: article.articleNumber,
            description: article.name,
            unit: article.unit || 'STK',
            price: parseFloat(article.price) || 0,
            supplier: article.supplier,
            category: article.category,
            rskNumber: article.rskNumber || ''
        });
        onClose();
    };

    return (
        <div className="article-picker-overlay">
            <div className="article-picker-modal">
                <div className="article-picker-header">
                    <h3>Sök artikel</h3>
                    <button className="close-button" onClick={onClose}>✕</button>
                </div>

                <div className="article-picker-filters">
                    <div style={{display: 'flex', gap: '10px', width: '100%', alignItems: 'flex-end'}}>
                        <div style={{flex: 2}}>
                            <input
                                type="text"
                                placeholder="Sök på namn, artikelnummer eller RSK-nummer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="search-input"
                                autoFocus
                                style={{width: '100%'}}
                            />
                        </div>
                        <button 
                            onClick={handleSearch}
                            disabled={isLoading || searchTerm.length < 2}
                            style={{
                                padding: '10px 30px',
                                backgroundColor: isLoading || searchTerm.length < 2 ? '#ccc' : '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isLoading || searchTerm.length < 2 ? 'not-allowed' : 'pointer',
                                fontWeight: 500,
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {isLoading ? 'Söker...' : 'Sök'}
                        </button>
                    </div>

                    <div style={{display: 'flex', gap: '10px', width: '100%', marginTop: '10px'}}>
                        <select 
                            value={selectedSupplier} 
                            onChange={(e) => handleSupplierChange(e.target.value)}
                            className="filter-select"
                        >
                            {suppliers.map(s => (
                                <option key={s} value={s}>{s === 'Alla' ? 'Alla leverantörer' : s}</option>
                            ))}
                        </select>

                        <select 
                            value={selectedCategory} 
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="filter-select"
                            disabled={categories.length <= 1 || articles.length === 0}
                        >
                            {categories.map(c => (
                                <option key={c} value={c}>{c === 'Alla' ? 'Alla kategorier' : c}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="article-picker-list">
                    {searchMessage && (
                        <div style={{
                            padding: '15px',
                            textAlign: 'center',
                            color: articles.length > 0 ? '#4CAF50' : '#666',
                            fontWeight: 500,
                            borderBottom: articles.length > 0 ? '1px solid #e0e0e0' : 'none'
                        }}>
                            {searchMessage}
                        </div>
                    )}

                    {!searchMessage && !isLoading && (
                        <div className="no-results" style={{padding: '40px'}}>
                            <h4>🔍 Sök efter artiklar</h4>
                            <p style={{marginTop: '15px', lineHeight: '1.6'}}>
                                Skriv minst 2 tecken och tryck på <strong>Sök</strong>-knappen eller <strong>Enter</strong>
                            </p>
                            <div style={{marginTop: '20px', textAlign: 'left', display: 'inline-block'}}>
                                <p><strong>Du kan söka på:</strong></p>
                                <ul style={{marginTop: '10px'}}>
                                    <li>Artikelnamn (t.ex. "kabel")</li>
                                    <li>Artikelnummer (t.ex. "12345")</li>
                                    <li>RSK-nummer (t.ex. "5514321")</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {articles.length > 0 && (
                        <table className="article-picker-table">
                            <thead>
                                <tr>
                                    <th>Artikelnr</th>
                                    <th>Benämning</th>
                                    <th>RSK</th>
                                    <th>Leverantör</th>
                                    <th>Kategori</th>
                                    <th>Enhet</th>
                                    <th>Pris</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {articles.map(article => (
                                    <tr key={article.id}>
                                        <td>{article.articleNumber}</td>
                                        <td>{article.name}</td>
                                        <td>{article.rskNumber || '-'}</td>
                                        <td>{article.supplier}</td>
                                        <td>{article.category || '-'}</td>
                                        <td>{article.unit || 'STK'}</td>
                                        <td>{parseFloat(article.price).toFixed(2)} kr</td>
                                        <td>
                                            <button 
                                                className="select-button"
                                                onClick={() => handleSelectArticle(article)}
                                            >
                                                Välj
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="article-picker-footer">
                    <p className="result-count">
                        {articles.length > 0 && `${articles.length} artiklar`}
                        {articles.length >= 2000 && ' (max 2000 visas)'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ArticlePicker;
