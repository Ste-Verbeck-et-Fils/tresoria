import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Feedback from '../../../components/ui/Feedback';
import Loader from '../../../components/ui/Loader';
import { detectOperator, purchaseAirtime } from '../../../services/maishapayService';

const MaishaPayAirtime = () => {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [operator, setOperator] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleDetect = async () => {
    if (!phone || !phone.startsWith('+243')) {
      setFeedback({ type: 'error', message: 'Veuillez entrer un numéro valide au format +243...' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    setOperator(null);

    try {
      const result = await detectOperator(phone);
      if (result.success && result.operator) {
        setOperator(result.operator);
        setFeedback({ type: 'success', message: 'Opérateur détecté avec succès.' });
      } else {
        setFeedback({ type: 'error', message: 'Impossible de détecter l\'opérateur.' });
      }
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Erreur lors de la détection.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setFeedback({ type: 'error', message: 'Veuillez entrer un montant valide.' });
      return;
    }
    if (!operator) {
      setFeedback({ type: 'error', message: 'Opérateur non détecté.' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const result = await purchaseAirtime(phone, amount, operator.id);
      if (result.success) {
        setFeedback({ type: 'success', message: `Achat de ${amount} CDF réussi pour le ${phone} !` });
        setPhone('');
        setAmount('');
        setOperator(null);
      } else {
        setFeedback({ type: 'error', message: 'L\'achat a échoué.' });
      }
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Erreur lors de l\'achat.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', maxWidth: '400px', margin: '0 auto' }}>
      <h3 style={{ marginBottom: '15px', color: '#333' }}>Achat de Crédit Téléphonique</h3>
      
      {feedback && (
        <div style={{ marginBottom: '15px' }}>
          <Feedback type={feedback.type} message={feedback.message} onClose={() => setFeedback(null)} />
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <Input
          id="phone"
          label="Numéro de téléphone (+243...)"
          placeholder="+243XXXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={loading}
        />
        <Button 
          onClick={handleDetect} 
          disabled={loading || !phone} 
          style={{ marginTop: '10px', width: '100%' }}
          variant="secondary"
        >
          {loading && !operator ? 'Détection en cours...' : 'Détecter l\'opérateur'}
        </Button>
      </div>

      {operator && (
        <div style={{ backgroundColor: '#e9f5ff', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 10px', fontWeight: '500' }}>Opérateur détecté : <strong>{operator.name}</strong></p>
          {operator.logo && <img src={operator.logo} alt="Logo" style={{ maxHeight: '40px', borderRadius: '4px' }} />}
        </div>
      )}

      {operator && (
        <form onSubmit={handlePurchase}>
          <div style={{ marginBottom: '20px' }}>
            <Input
              id="amount"
              type="number"
              label="Montant (CDF)"
              placeholder="Ex: 1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading || !amount} 
            style={{ width: '100%' }}
            variant="super"
          >
            {loading ? 'Achat en cours...' : 'Acheter le crédit'}
          </Button>
        </form>
      )}
    </div>
  );
};

export default MaishaPayAirtime;
