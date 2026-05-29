import { Injectable, inject } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';

type Severity = 'success' | 'info' | 'warn' | 'error';

interface ConfirmDialogOptions {
    message: string;
    header?: string;
    acceptLabel?: string;
    rejectLabel?: string;
    icon?: string;
    acceptButtonStyleClass?: string;
    rejectButtonStyleClass?: string;
    accept?: () => void;
    reject?: () => void;
}

@Injectable({
    providedIn: 'root',
})
export class DialogService {
    private readonly messages = inject(MessageService);
    private readonly confirm = inject(ConfirmationService);

    toast(severity: Severity, detail: string, summary?: string): void {
        this.messages.add({
            severity,
            summary: summary ?? this.defaultSummary(severity),
            detail,
            life: 3500,
        });
    }

    success(detail: string, summary?: string): void {
        this.toast('success', detail, summary);
    }

    info(detail: string, summary?: string): void {
        this.toast('info', detail, summary);
    }

    warn(detail: string, summary?: string): void {
        this.toast('warn', detail, summary);
    }

    error(detail: string, summary?: string): void {
        this.toast('error', detail, summary);
    }

    confirmDialog(options: ConfirmDialogOptions): void {
        this.confirm.confirm({
            message: options.message,
            header: options.header ?? 'Confirmação',
            icon: options.icon ?? 'pi pi-exclamation-triangle',
            acceptLabel: options.acceptLabel ?? 'Sim',
            rejectLabel: options.rejectLabel ?? 'Não',
            acceptButtonStyleClass: options.acceptButtonStyleClass,
            rejectButtonStyleClass: options.rejectButtonStyleClass,
            accept: options.accept,
            reject: options.reject,
        });
    }

    private defaultSummary(severity: Severity): string {
        switch (severity) {
            case 'success':
                return 'Sucesso';
            case 'info':
                return 'Informação';
            case 'warn':
                return 'Atenção';
            case 'error':
                return 'Erro';
        }
    }
}