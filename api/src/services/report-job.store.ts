// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { randomUUID } from 'crypto';
import { ReportDTO } from '../models/report.model';

/** How long a completed/failed job is kept in memory before being removed. */
const JOB_TTL_MS = 30 * 60 * 1000; // 30 minutes

export type ReportJobStatus = 'pending' | 'complete' | 'error';

export interface ReportJob {
    status: ReportJobStatus;
    report?: ReportDTO;
    error?: string;
    createdAt: number;
}

/**
 * In-memory store for async report generation jobs.
 *
 * Each job is identified by a UUID and has a TTL after which it is
 * automatically evicted to prevent unbounded memory growth.
 */
class ReportJobStore {
    private readonly jobs = new Map<string, ReportJob>();

    /** Create a new pending job and return its ID. */
    create(): string {
        const id = randomUUID();
        this.jobs.set(id, { status: 'pending', createdAt: Date.now() });
        setTimeout(() => this.jobs.delete(id), JOB_TTL_MS);
        return id;
    }

    /** Mark a job as successfully completed with the generated report. */
    complete(id: string, report: ReportDTO): void {
        const job = this.jobs.get(id);
        if (job) {
            job.status = 'complete';
            job.report = report;
        }
    }

    /** Mark a job as failed with an error message. */
    fail(id: string, error: string): void {
        const job = this.jobs.get(id);
        if (job) {
            job.status = 'error';
            job.error = error;
        }
    }

    /** Retrieve a job by ID, or undefined if it does not exist / has expired. */
    get(id: string): ReportJob | undefined {
        return this.jobs.get(id);
    }
}

export const reportJobStore = new ReportJobStore();
