"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  canRetryFailedItems,
  getStatusLabel,
  shouldAutoRefreshJob
} from "@/i18n/job-status";
import { formatDateTime, formatTime } from "@/i18n/locale";
import { useI18n } from "@/i18n/use-i18n";
import {
  actionRetryFailed,
  actionRetryImage,
  getImageSetJob,
  imageContentUrl
} from "@/lib/api";

const AUTO_REFRESH_MS = 3000;
const FEEDBACK_RESET_MS = 3_000;

type JobDetail = Awaited<ReturnType<typeof getImageSetJob>>;

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { locale, t } = useI18n();
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [retryFailedLoading, setRetryFailedLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [activeTab, setActiveTab] = useState<"images" | "planning" | "prompts" | "events">("images");
  const jobId = Array.isArray(id) ? id[0] : id;

  const fetchDetail = async (options: { preserveFeedback?: boolean } = {}) => {
    if (!jobId) return;
    setLoading(true);
    try {
      setDetail(await getImageSetJob(jobId));
      if (!options.preserveFeedback) {
        setFeedback("");
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t.detail.messages.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  const clearFeedbackLater = () => {
    window.setTimeout(() => setFeedback(""), FEEDBACK_RESET_MS);
  };

  const refreshDetail = useEffectEvent(() => {
    void fetchDetail();
  });

  useEffect(() => {
    void fetchDetail();
  }, [jobId]);

  useEffect(() => {
    if (!detail || !shouldAutoRefreshJob(detail.job.status)) {
      return;
    }

    const timer = window.setInterval(() => {
      refreshDetail();
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(timer);
  }, [detail?.job.status, refreshDetail]);

  const handleRetryImage = async (imageIndex: number) => {
    if (!jobId) return;
    try {
      await actionRetryImage(jobId, imageIndex);
      setFeedback(t.detail.messages.retryImageSuccess(imageIndex));
      await fetchDetail({ preserveFeedback: true });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t.common.unknownError);
    }
    clearFeedbackLater();
  };

  const handleRetryFailed = async () => {
    if (!jobId) return;
    setRetryFailedLoading(true);
    try {
      await actionRetryFailed(jobId);
      setFeedback(t.detail.messages.retryFailedSuccess);
      await fetchDetail({ preserveFeedback: true });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t.common.unknownError);
    } finally {
      setRetryFailedLoading(false);
    }
    clearFeedbackLater();
  };

  const tabs = [
    { id: "images", label: `🖼️ ${t.detail.tabs.images}`, color: "var(--sticky-yellow)" },
    { id: "planning", label: `📋 ${t.detail.tabs.planning}`, color: "var(--sticky-blue)" },
    { id: "prompts", label: `✍️ ${t.detail.tabs.prompts}`, color: "var(--sticky-purple)" },
    { id: "events", label: `📓 ${t.detail.tabs.events}`, color: "var(--sticky-green)" }
  ] as const;
  const statusLabel = detail ? getStatusLabel(detail.job.status, t) : "";
  const showRetryFailedAction = detail ? canRetryFailedItems(detail.job.status) : false;

  return (
    <section className="page-shell">
      <div className="panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="button button-secondary" onClick={() => router.back()}>
              ← {t.detail.closeNotebook}
            </button>
            {showRetryFailedAction ? (
              <button
                className="button"
                onClick={() => void handleRetryFailed()}
                disabled={retryFailedLoading}
              >
                {t.detail.actions.retryFailed}
              </button>
            ) : null}
          </div>
          <div style={{ transform: 'rotate(1deg)', background: 'var(--accent)', color: 'white', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sketch)', fontWeight: 'bold' }}>
            {t.detail.status(statusLabel)}
          </div>
        </div>

        {feedback ? <div className="message">{feedback}</div> : null}

        {detail ? (
          <>
            <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
              <h1 style={{ fontSize: '3rem' }}>{detail.job.theme}</h1>
              <p className="subtitle">{t.detail.recordedAt(formatDateTime(locale, detail.job.created_at))}</p>
            </div>

            {/* Tabs - 像索引贴一样 */}
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem', paddingLeft: '1rem' }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{ 
                    background: activeTab === tab.id ? tab.color : 'white',
                    border: '2px solid var(--ink)',
                    borderBottom: activeTab === tab.id ? 'none' : '2px solid var(--ink)',
                    padding: '0.75rem 1.5rem',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    borderRadius: '10px 10px 0 0',
                    zIndex: activeTab === tab.id ? 2 : 1,
                    marginBottom: '-2px',
                    transform: activeTab === tab.id ? 'translateY(-2px)' : 'none'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ 
              border: '2px solid var(--ink)', 
              padding: '2.5rem', 
              borderRadius: '0 15px 15px 15px', 
              background: activeTab === 'images' ? 'var(--sticky-yellow)' : 
                          activeTab === 'planning' ? 'var(--sticky-blue)' : 
                          activeTab === 'prompts' ? 'var(--sticky-purple)' : 'var(--sticky-green)',
              minHeight: '500px'
            }}>
              {/* 图片展示 - 照片墙风格 */}
              {activeTab === "images" && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '2.5rem' }}>
                  {detail.images.map((image, idx) => (
                    <div key={image.id} style={{ 
                      background: 'white', 
                      padding: '1rem 1rem 3rem 1rem', 
                      border: '1px solid #ddd', 
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                      transform: `rotate(${idx % 2 === 0 ? '1.5' : '-1.5'}deg)`,
                      position: 'relative'
                    }}>
                      <div style={{ position: 'absolute', top: '-15px', left: '50%', width: '40px', height: '15px', background: 'rgba(0,0,0,0.1)', transform: 'translateX(-50%)', borderRadius: '2px' }}></div>
                      
                      {image.image_url ? (
                        <img
                          src={imageContentUrl(detail.job.id, image.image_index)}
                          style={{ width: '100%', height: 'auto', display: 'block' }}
                          alt={t.detail.imageAlt(image.image_index)}
                        />
                      ) : (
                        <div style={{ height: '300px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: '#999' }}>
                          {t.detail.imagePending}
                        </div>
                      )}
                      
                      <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}># {image.image_index}</span>
                        <button 
                          onClick={() => handleRetryImage(image.image_index)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                          title={t.detail.retryImageTitle(image.image_index)}
                        >
                          🔄
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 规划详情 */}
              {activeTab === "planning" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {detail.plan_items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: '2rem', opacity: 0.3, fontWeight: 'bold' }}>{item.image_index}</div>
                      <div>
                        <h3 style={{ margin: '0 0 0.5rem 0' }}>{item.title}</h3>
                        <p style={{ margin: 0, lineHeight: '1.6' }}>{item.purpose}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 提示词 */}
              {activeTab === "prompts" && (
                <div style={{ display: 'grid', gap: '2rem' }}>
                  {detail.prompts.map((item) => (
                    <div key={item.id}>
                      <h4 style={{ margin: '0 0 0.5rem 0' }}>{t.detail.promptTitle(item.image_index)}：</h4>
                      <div style={{ background: 'rgba(255,255,255,0.5)', padding: '1.5rem', border: '1px dashed var(--ink)', borderRadius: '8px', fontStyle: 'italic' }}>
                        {item.final_prompt || t.detail.promptPending}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 日志 */}
              {activeTab === "events" && (
                <div style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                  {detail.events.map((event) => (
                    <div key={event.id} style={{ marginBottom: '0.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--ink-light)' }}>[{formatTime(locale, event.created_at)}]</span>
                      <span style={{ fontWeight: 'bold', margin: '0 10px' }}>{event.stage}</span>
                      <span>{event.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '5rem' }}>
            {loading ? t.detail.loading : t.detail.messages.loadFailed}
          </div>
        )}
      </div>
    </section>
  );
}
