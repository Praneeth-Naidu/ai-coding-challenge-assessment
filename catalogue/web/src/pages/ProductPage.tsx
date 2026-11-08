import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError, getProduct, submitEnquiry } from '../api/client.js';
import type { EnquiryBody } from '../api/types.js';
import { EnquiryForm } from '../components/EnquiryForm.js';
import { ErrorMessage, Loading } from '../components/StateViews.js';
import { useAsync } from '../hooks/useAsync.js';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function ProductPage() {
  const { id = '' } = useParams();
  const productId = Number(id);
  const { data: product, error, loading, reload } = useAsync(() => Number.isInteger(productId) && productId > 0
    ? getProduct(productId)
    : Promise.reject(new Error('The requested product was not found.')), [productId]);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [sending, setSending] = useState(false);
  const [enquiryError, setEnquiryError] = useState<string | null>(null);
  const [enquirySent, setEnquirySent] = useState(false);

  async function handleEnquiry(body: EnquiryBody): Promise<void> {
    setSending(true);
    setEnquiryError(null);
    try {
      await submitEnquiry(body);
      setEnquirySent(true);
    } catch (error) {
      setEnquiryError(error instanceof ApiError ? error.message : 'Your enquiry could not be sent. Please try again.');
    } finally {
      setSending(false);
    }
  }
  return (
    <div className="page-shell page-content">
      {loading && <Loading label="Loading product…" />}
      {error && <ErrorMessage message={error.message} onRetry={reload} />}
      {product && <div className="two-column">
        <div className="product-detail-image">
          <img src={product.image || '/images/product-placeholder.svg'} alt={product.title}
            onError={(event) => { event.currentTarget.src = '/images/product-placeholder.svg'; }} />
        </div>
        <div className="product-copy">
          <span className="eyebrow">{product.category}</span>
          <h1 data-testid="product-title">{product.title}</h1>
          <p className="product-rating">★ {product.rating.rate.toFixed(1)} · {product.rating.count} reviews</p>
          <p className="price-large" data-testid="product-price">{money.format(product.price)}</p>
          <p data-testid="product-description">{product.description}</p>
          <button className="button" data-testid="enquire-button" type="button" onClick={() => setShowEnquiry((visible) => !visible)}>
            {showEnquiry ? 'Close enquiry' : 'Enquire about this product'}
          </button>
          {showEnquiry && <EnquiryForm productId={product.id} productTitle={product.title} sending={sending}
            apiError={enquiryError} sent={enquirySent} onSubmit={(body) => { void handleEnquiry(body); }} />}
        </div>
      </div>}
    </div>
  );
}
