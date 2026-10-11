"use client";

import * as React from "react";
import { useId, useMemo, useState } from "react";
import { Download, File, Loader2, MoreVertical, Pencil, Trash2, Upload, X } from 'lucide-react';

import { Button } from '../components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/dropdown-menu';
import { Input } from '../components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/table';
import { cn } from "../lib/utils";
import { LocalDateTime } from "./local-date-time";
import { parseDisplayDate } from "../lib/date-utils";

export interface AttachmentDocument {
  document_metadata_id: string;
  document_type: string | null;
  attached_at: string;
  title: string | null;
  file_name: string | null;
  file_path: string | null;
  source_size: number | null;
  download_url: string | null;
}

export interface AttachmentTypeOption {
  type_key: string;
  display_name: string;
  category: string;
  sort_order: number;
}

function getDocumentName(doc: AttachmentDocument): string {
  return doc.title ?? doc.file_name ?? doc.document_metadata_id;
}

function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return parseDisplayDate(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const NO_DOCUMENT_TYPE = "__none";

export interface DocumentAttachmentsViewProps {
  documents: AttachmentDocument[];
  documentTypes?: AttachmentTypeOption[];
  isLoading?: boolean;
  uploading?: string[];
  removingDocumentId?: string;
  updatingDocumentId?: string;
  editingDocumentId?: string | null;
  onEditingChange?: (id: string | null) => void;
  onFiles: (files: File[]) => void;
  onDelete?: (id: string) => void;
  onDownload?: (document: AttachmentDocument) => void;
  onDocumentTypeChange?: (id: string, type: string | null) => void;
  renderAttachedAt?: (value: string) => React.ReactNode;
  heading?: React.ReactNode;
  accept?: string;
  inputId?: string;
  className?: string;
  hideIfEmpty?: boolean;
  displayMode?: "list" | "table";
}

/** Portable attachment presentation; the host owns upload and persistence. */
export function DocumentAttachmentsView({
  documents: docs, documentTypes = [], isLoading = false, uploading = [],
  removingDocumentId, updatingDocumentId, editingDocumentId, onEditingChange,
  onFiles, onDelete, onDownload, onDocumentTypeChange, renderAttachedAt,
  heading, accept, inputId, className, hideIfEmpty = false, displayMode = "list",
}: DocumentAttachmentsViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const generatedId = useId();
  const fileInputId = inputId ?? generatedId;
  const typeLabelByKey = useMemo(() => new Map(documentTypes.map((option) => [option.type_key, option.display_name])), [documentTypes]);
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    onFiles(Array.from(e.dataTransfer.files));
  };

  const isUploadingAny = uploading.length > 0;

  if (hideIfEmpty && !isLoading && docs.length === 0) {
    return null;
  }

  const getDocumentTypeLabel = (doc: AttachmentDocument) =>
    doc.document_type
      ? typeLabelByKey.get(doc.document_type) ?? doc.document_type
      : 'Uncategorized';

  const renderDocumentTypeControl = (doc: AttachmentDocument, className?: string) => {
    const name = getDocumentName(doc);

    if (documentTypes.length === 0) return null;
    if (!onDocumentTypeChange) return <span>{getDocumentTypeLabel(doc)}</span>;

    return (
      <Select
        value={doc.document_type ?? NO_DOCUMENT_TYPE}
        disabled={
          updatingDocumentId === doc.document_metadata_id
        }
        onValueChange={(value) =>
          onDocumentTypeChange?.(doc.document_metadata_id, value === NO_DOCUMENT_TYPE ? null : value)
        }
      >
        <SelectTrigger
          size="sm"
          aria-label={`Document type for ${name}`}
          className={cn('h-8 min-w-0 w-full sm:w-44', className)}
        >
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_DOCUMENT_TYPE}>Uncategorized</SelectItem>
          {documentTypes.map((option) => (
            <SelectItem key={option.type_key} value={option.type_key}>
              {option.display_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const renderActions = (doc: AttachmentDocument) => {
    if (!onDelete && !(onDocumentTypeChange && onEditingChange) && !(doc.download_url && onDownload)) return null;
    const isRemoving =
      removingDocumentId === doc.document_metadata_id;
    const name = getDocumentName(doc);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground"
            aria-label={`Attachment actions for ${name}`}
          >
            {isRemoving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreVertical className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {onDocumentTypeChange && onEditingChange && <DropdownMenuItem
            disabled={documentTypes.length === 0}
            onSelect={() => onEditingChange?.(doc.document_metadata_id)}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </DropdownMenuItem>}
          {doc.download_url && onDownload && (
            <DropdownMenuItem
              onSelect={() => onDownload?.(doc)}
            >
              <Download className="h-4 w-4" />
              Download
            </DropdownMenuItem>
          )}
          {onDelete && <DropdownMenuItem
            variant="destructive"
            disabled={isRemoving}
            onSelect={() => onDelete?.(doc.document_metadata_id)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderTable = () => (
    <div className="rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Attached</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="py-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading…
                </div>
              </TableCell>
            </TableRow>
          ) : isUploadingAny && docs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading {uploading.join(', ')}…
                </div>
              </TableCell>
            </TableRow>
          ) : docs.length === 0 && !isUploadingAny ? (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-sm text-muted-foreground">
                No attachments yet.
              </TableCell>
            </TableRow>
          ) : (
            docs.map((doc) => {
              const name = getDocumentName(doc);
              return (
                <TableRow key={doc.document_metadata_id}>
                  <TableCell className="max-w-none">
                    <div className="flex min-w-0 items-center gap-3">
                      <File className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {doc.source_size ? formatBytes(doc.source_size) : ''}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-none">{renderDocumentTypeControl(doc)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {doc.attached_at ? (renderAttachedAt?.(doc.attached_at) ?? <LocalDateTime value={doc.attached_at} render={(stamp) => formatDate(stamp)} />) : null}
                  </TableCell>
                  <TableCell className="max-w-none">{renderActions(doc)}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );

  const content = (
    <div className={cn('space-y-3', className)}>
      {/* Dropzone upload trigger (matches change-events form) */}
      <label
        htmlFor={fileInputId}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          // A drop target for an optional file list earns one compact strip, not
          // a tall banner above the files it holds.
          'flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 py-1.5 text-center transition-colors hover:bg-muted/30',
          isDragging && 'bg-muted/50',
          isUploadingAny && 'pointer-events-none opacity-50',
        )}
      >
        <Input
          id={fileInputId}
          type="file"
          multiple
          accept={accept}
          className="sr-only"
          onChange={(e) => onFiles(Array.from(e.target.files ?? []))}
          disabled={isUploadingAny}
        />
        {isUploadingAny ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Uploading {uploading.join(', ')}…
            </span>
          </>
        ) : (
          <>
            <Upload className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              {isDragging ? (
                'Drop to upload'
              ) : (
                <>
                  Drop files here or{' '}
                  <span className="font-semibold text-primary">browse to upload</span>
                </>
              )}
            </p>
          </>
        )}
      </label>

      {/* Document list */}
      {displayMode === 'table' ? renderTable() : isLoading ? (
        <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : docs.length === 0 && !isUploadingAny ? (
        null
      ) : (
        <ul className=" divide-border/50">
          {docs.map((doc) => {
            const name = getDocumentName(doc);
            const isEditing = editingDocumentId === doc.document_metadata_id;
            return (
              <li
                key={doc.document_metadata_id}
                className="py-2.5 first:pt-0"
              >
                <div className="flex items-center gap-3">
                  <File className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      {/*
                        Category sits beside the filename, not under it. A second
                        line under a title is where a field goes when there is no
                        column for it (DESIGN.md) — and here it doubled
                        every attachment row's height for one word.
                      */}
                      <div className="flex min-w-0 items-baseline gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{name}</p>
                        <p className="shrink-0 text-xs text-muted-foreground">
                          {getDocumentTypeLabel(doc)}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {renderActions(doc)}
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        {renderDocumentTypeControl(doc, 'sm:w-52')}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-fit px-2 text-muted-foreground"
                          onClick={() => onEditingChange?.(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  return (
    <section className="space-y-4">
      {heading}
      {content}
    </section>
  );
}

export function LinkedDocumentsView({ documents: docs, isLoading = false }: { documents: AttachmentDocument[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading linked documents…
      </div>
    );
  }

  if (!docs.length) return null;

  return (
    <ul className="mt-2 space-y-1">
      {docs.map((doc) => (
        <li key={doc.document_metadata_id} className="flex items-center gap-2 text-sm">
          <File className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {getDocumentName(doc)}
          </span>
          {doc.document_type && (
            <span className="shrink-0 text-xs text-muted-foreground">
              ({doc.document_type})
            </span>
          )}
          {doc.download_url && (
            <a
              href={doc.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto shrink-0 text-xs text-primary hover:underline"
            >
              Download
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

export interface DocumentLinkViewProps {
  open: boolean;
  value: string;
  isPending?: boolean;
  onOpen: () => void;
  onValueChange: (value: string) => void;
  onAttach: (value: string) => void;
  onCancel: () => void;
}

export function DocumentLinkView({ open, value: docId, isPending = false, onOpen, onValueChange, onAttach, onCancel }: DocumentLinkViewProps) {
  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => onOpen()} className="gap-1.5">
        <X className="h-3.5 w-3.5 rotate-45" />
        Link existing
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/30 px-3 py-2">
      <Input
        className="flex-1 border-0 bg-transparent p-0 text-sm shadow-none outline-none focus-visible:ring-0 placeholder:text-muted-foreground"
        placeholder="Paste document_metadata ID…"
        value={docId}
        onChange={(e) => onValueChange(e.target.value)}
      />
      <Button
        size="sm"
        disabled={!docId || isPending}
        onClick={() => onAttach(docId)}
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          'Link'
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          onCancel();
        }}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
