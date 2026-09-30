/* ============================================================
   CAMPAIGNS PAGE — WhatsApp Marketing & Movie Promotions
   Manage broadcasts, message templates, theater movie trailers & promos.
   ============================================================ */

import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../../context/ToastContext';
import {
  subscribeToCampaigns,
  createCampaign,
  triggerCampaignExecution,
  subscribeToMoviePromotions,
  createMoviePromotion,
  deleteMoviePromotion,
} from '../../services/campaignService';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatters';

export default function CampaignsPage() {
  const { tenantId, tenant } = useTenant();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState('CAMPAIGNS'); // CAMPAIGNS | MOVIES
  const [campaigns, setCampaigns] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Campaign Modal
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    messageBody: '',
    templateName: '',
    targetType: 'ALL_CUSTOMERS', // ALL_CUSTOMERS | CUSTOM
  });

  // Movie Promo Modal
  const [isMovieModalOpen, setIsMovieModalOpen] = useState(false);
  const [movieForm, setMovieForm] = useState({
    movieTitle: '',
    language: 'Tamil',
    releaseDate: '',
    synopsis: '',
    posterUrl: '',
    trailerUrl: '',
    promoMessage: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [executingCampaign, setExecutingCampaign] = useState(null);

  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);
    const unsubCampaigns = subscribeToCampaigns(tenantId, (camps) => {
      setCampaigns(camps);
      setLoading(false);
    });

    const unsubPromos = subscribeToMoviePromotions(tenantId, (promos) => {
      setPromotions(promos);
    });

    return () => {
      unsubCampaigns();
      unsubPromos();
    };
  }, [tenantId]);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!campaignForm.title || (!campaignForm.messageBody && !campaignForm.templateName)) {
      showError('Please enter campaign title and message content.');
      return;
    }

    setSubmitting(true);
    try {
      await createCampaign(tenantId, campaignForm);
      showSuccess('Campaign created in draft!');
      setIsCampaignModalOpen(false);
    } catch (err) {
      showError(err.message || 'Failed to create campaign.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteCampaign = async () => {
    if (!executingCampaign) return;
    setSubmitting(true);
    try {
      await triggerCampaignExecution(tenantId, executingCampaign.id);
      showSuccess(`Campaign "${executingCampaign.title}" execution dispatched!`);
      setExecutingCampaign(null);
    } catch (err) {
      showError(err.message || 'Failed to dispatch campaign.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateMoviePromo = async (e) => {
    e.preventDefault();
    if (!movieForm.movieTitle) {
      showError('Movie title is required.');
      return;
    }

    setSubmitting(true);
    try {
      await createMoviePromotion(tenantId, movieForm);
      showSuccess('Movie promotion added!');
      setIsMovieModalOpen(false);
    } catch (err) {
      showError(err.message || 'Failed to add movie promotion.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMoviePromo = async (promoId) => {
    try {
      await deleteMoviePromotion(tenantId, promoId);
      showSuccess('Movie promotion removed.');
    } catch (err) {
      showError('Failed to delete movie promo.');
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Loading campaigns..." />;
  }

  const isTheater = tenant?.type === 'THEATER' || true; // Show tab for all with theater support

  return (
    <div className="page-container">
      <PageHeader
        title="Marketing & WhatsApp Campaigns"
        description="Broadcast promotions, new menu announcements, and theater movie teasers directly over WhatsApp."
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {activeTab === 'CAMPAIGNS' ? (
              <button className="btn btn-primary" onClick={() => setIsCampaignModalOpen(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create Campaign
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => setIsMovieModalOpen(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add Movie Promo
              </button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="card mb-6" style={{ padding: '0.75rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className={`btn ${activeTab === 'CAMPAIGNS' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('CAMPAIGNS')}
          >
            📢 WhatsApp Broadcast Campaigns ({campaigns.length})
          </button>
          <button
            className={`btn ${activeTab === 'MOVIES' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('MOVIES')}
          >
            🎬 Movie Promotions & Posters ({promotions.length})
          </button>
        </div>
      </div>

      {activeTab === 'CAMPAIGNS' ? (
        <div>
          {/* Campaign stats */}
          <div className="stats-grid mb-6">
            <StatCard
              title="Total Campaigns"
              value={campaigns.length}
              subtitle="All time created"
              variant="primary"
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              }
            />
            <StatCard
              title="Total Messages Dispatched"
              value={campaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0)}
              subtitle="Via WhatsApp Cloud API"
              variant="success"
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              }
            />
            <StatCard
              title="Completed Broadcasts"
              value={campaigns.filter((c) => c.status === 'COMPLETED').length}
              subtitle="Fully delivered"
              variant="info"
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              }
            />
          </div>

          {/* Campaigns list */}
          {campaigns.length === 0 ? (
            <EmptyState
              icon="send"
              title="No campaigns yet"
              description="Create a WhatsApp marketing campaign to re-engage your customers with discounts or new releases."
              action={
                <button className="btn btn-primary" onClick={() => setIsCampaignModalOpen(true)}>
                  Create First Campaign
                </button>
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {campaigns.map((camp) => (
                <div key={camp.id} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: '0 0 0.35rem 0' }}>{camp.title}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                        Created on {formatDate(camp.createdAt)}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className={`badge ${camp.status === 'COMPLETED' ? 'badge-success' : camp.status === 'RUNNING' ? 'badge-warning' : 'badge-default'}`}>
                        {camp.status}
                      </span>
                    </div>
                  </div>

                  {camp.messageBody && (
                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.9rem', borderLeft: '3px solid #25D366' }}>
                      "{camp.messageBody}"
                    </div>
                  )}

                  {/* Broadcast metrics */}
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                    <span>Target Recipients: <strong>{camp.totalRecipients || 'All registered'}</strong></span>
                    <span>Delivered: <strong style={{ color: 'var(--color-success)' }}>{camp.sentCount || 0}</strong></span>
                    <span>Failed: <strong style={{ color: camp.failedCount > 0 ? 'var(--color-danger)' : 'inherit' }}>{camp.failedCount || 0}</strong></span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                    {camp.status === 'DRAFT' && (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem', backgroundColor: '#25D366', borderColor: '#25D366' }}
                        onClick={() => setExecutingCampaign(camp)}
                      >
                        🚀 Dispatch Broadcast Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Movie Promotions Tab */
        <div>
          {promotions.length === 0 ? (
            <EmptyState
              icon="film"
              title="No movie promotions active"
              description="Theaters can showcase upcoming movies, show timings, and trailer links here to generate WhatsApp excitement."
              action={
                <button className="btn btn-primary" onClick={() => setIsMovieModalOpen(true)}>
                  Add Movie Promotion
                </button>
              }
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {promotions.map((promo) => (
                <div key={promo.id} className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {/* Poster */}
                  <div style={{ height: '220px', backgroundColor: 'rgba(255,255,255,0.03)', position: 'relative' }}>
                    {promo.posterUrl ? (
                      <img src={promo.posterUrl} alt={promo.movieTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                        🎬
                      </div>
                    )}
                    <span style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.8)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {promo.language || 'English'}
                    </span>
                  </div>

                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.35rem 0' }}>{promo.movieTitle}</h3>
                    {promo.releaseDate && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-primary-400)', fontWeight: 600, margin: '0 0 0.75rem 0' }}>
                        Showing: {promo.releaseDate}
                      </p>
                    )}
                    {promo.synopsis && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.4, margin: '0 0 1rem 0' }}>
                        {promo.synopsis}
                      </p>
                    )}

                    <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                      {promo.trailerUrl && (
                        <a
                          href={promo.trailerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.8rem', textAlign: 'center' }}
                        >
                          ▶ Watch Trailer
                        </a>
                      )}
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                        onClick={() => handleDeleteMoviePromo(promo.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Campaign Modal */}
      {isCampaignModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">New WhatsApp Campaign</h3>
              <button className="btn-close" onClick={() => setIsCampaignModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateCampaign}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Campaign Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Weekend Popcorn Special 20% Off"
                    value={campaignForm.title}
                    onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Target Audience</label>
                  <select
                    className="form-control"
                    value={campaignForm.targetType}
                    onChange={(e) => setCampaignForm({ ...campaignForm, targetType: e.target.value })}
                  >
                    <option value="ALL_CUSTOMERS">All Registered Customers</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">WhatsApp Template Name (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. weekend_offer_v1 (Registered in Meta Manager)"
                    value={campaignForm.templateName}
                    onChange={(e) => setCampaignForm({ ...campaignForm, templateName: e.target.value })}
                  />
                  <small style={{ color: 'var(--color-text-secondary)', display: 'block', marginTop: '4px' }}>
                    Leave blank to send standard promotional text.
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">Message Text *</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Hello! Get 20% off all combos at our food counter today. Order directly here: https://our-engine.com/order/..."
                    value={campaignForm.messageBody}
                    onChange={(e) => setCampaignForm({ ...campaignForm, messageBody: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCampaignModalOpen(false)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Draft Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Movie Promo Modal */}
      {isMovieModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Add Movie Promotion</h3>
              <button className="btn-close" onClick={() => setIsMovieModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateMoviePromo}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Movie Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Leo / Inception"
                    value={movieForm.movieTitle}
                    onChange={(e) => setMovieForm({ ...movieForm, movieTitle: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Language</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Tamil / Hindi / English"
                      value={movieForm.language}
                      onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Show Dates / Timing</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Oct 19 - Oct 26"
                      value={movieForm.releaseDate}
                      onChange={(e) => setMovieForm({ ...movieForm, releaseDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Poster Image URL</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://images.example.com/poster.jpg"
                    value={movieForm.posterUrl}
                    onChange={(e) => setMovieForm({ ...movieForm, posterUrl: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Trailer Link (YouTube)</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://youtube.com/watch?v=..."
                    value={movieForm.trailerUrl}
                    onChange={(e) => setMovieForm({ ...movieForm, trailerUrl: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Synopsis</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Short description of the film..."
                    value={movieForm.synopsis}
                    onChange={(e) => setMovieForm({ ...movieForm, synopsis: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsMovieModalOpen(false)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Movie Promo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Execute confirmation */}
      {executingCampaign && (
        <ConfirmModal
          isOpen={true}
          title="Dispatch WhatsApp Broadcast"
          message={`Are you sure you want to broadcast "${executingCampaign.title}" to all eligible customers right now? This will dispatch WhatsApp messages via Meta Cloud API.`}
          confirmText="Yes, Send Broadcast"
          variant="primary"
          onConfirm={handleExecuteCampaign}
          onCancel={() => setExecutingCampaign(null)}
        />
      )}
    </div>
  );
}
