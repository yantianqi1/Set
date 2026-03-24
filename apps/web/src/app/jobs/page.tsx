"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getStatusLabel, JOB_STATUS_COLORS } from "@/i18n/job-status";
import { formatDateTime } from "@/i18n/locale";
import { useI18n } from "@/i18n/use-i18n";
import { listImageSetJobs } from "@/lib/api";
import { hasNextJobsPage, shouldShowJobsPagination } from "@/lib/jobs-pagination";

type JobSummary = {
  id: string;
  status: string;
  theme: string;
  image_count: number;
  success_images: number;
  failed_images: number;
  preview_image_url: string | null;
  created_at: string;
};

export default function JobsPage() {
  const { locale, t } = useI18n();
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    listImageSetJobs(page)
      .then((result) => {
        setJobs(result.items);
        setPageSize(result.pagination.page_size);
        setTotal(result.pagination.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const showPagination = shouldShowJobsPagination(total, pageSize);
  const hasNextPage = hasNextJobsPage(page, pageSize, total);

  return (
    <section className="page-shell">
      <div className="panel">
        <h1>{t.jobs.title}</h1>
        <p className="subtitle">{t.jobs.subtitle}</p>
        
        {loading && jobs.length === 0 ? (
          <div className="message">{t.jobs.loading}</div>
        ) : (
          <>
            <div style={{ display: "grid", gap: "1.25rem" }}>
              {jobs.map((job) => (
                <article
                  key={job.id}
                  style={{ 
                    padding: "1.5rem", 
                    background: "var(--surface-alt)", 
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.2rem" }}>{job.theme}</h3>
                      <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                        {t.jobs.createdAt(formatDateTime(locale, job.created_at))}
                      </p>
                    </div>
                    <span style={{ 
                      fontSize: "0.85rem", 
                      fontWeight: 600, 
                      color: JOB_STATUS_COLORS[job.status] ?? "var(--text)",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "99px",
                      background: "rgba(255,255,255,0.05)"
                    }}>
                      {getStatusLabel(job.status, t)}
                    </span>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
                        {t.jobs.progress(job.success_images + job.failed_images, job.image_count)}
                      </div>
                      <div style={{ 
                        height: "6px", 
                        background: "rgba(255,255,255,0.1)", 
                        borderRadius: "3px", 
                        overflow: "hidden",
                        display: "flex"
                      }}>
                        <div style={{ 
                          width: `${(job.success_images / job.image_count) * 100}%`, 
                          background: "#4ade80", 
                          height: "100%" 
                        }} />
                        <div style={{ 
                          width: `${(job.failed_images / job.image_count) * 100}%`, 
                          background: "#f87171", 
                          height: "100%" 
                        }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <Link href={`/jobs/${job.id}`} className="button" style={{ marginTop: 0, padding: "0.5rem 1rem", fontSize: "0.9rem" }}>
                        {t.jobs.actions.viewDetail}
                      </Link>
                      <Link href="/" className="button" style={{ 
                        marginTop: 0, 
                        padding: "0.5rem 1rem", 
                        fontSize: "0.9rem",
                        background: "transparent",
                        border: "1px solid var(--border)",
                        color: "var(--text)"
                      }}>
                        {t.jobs.actions.cloneConfig}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {showPagination && (
              <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "2rem" }}>
                <button
                  className="button"
                  style={{ padding: "0.5rem 1.5rem", background: "var(--surface-alt)", color: "var(--text)", border: "1px solid var(--border)" }}
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  {t.jobs.actions.previous}
                </button>
                <button
                  className="button"
                  style={{ padding: "0.5rem 1.5rem", background: "var(--surface-alt)", color: "var(--text)", border: "1px solid var(--border)" }}
                  disabled={!hasNextPage}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  {t.jobs.actions.next}
                </button>
              </div>
            )}
            
            {jobs.length === 0 && !loading && (
              <div className="message" style={{ justifyContent: "center" }}>
                {t.jobs.empty}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
