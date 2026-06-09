import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpEventType, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface UploadResult {
  file_id: string;
  filename: string;
  filesize: number;
  file_url: string;
  created_at: string;
  plan: string;
  upload_time?: number;
}

export interface UploadOptions {
  observe?: 'body' | 'events';
  reportProgress?: boolean;
}

export interface FilesResponse {
  files: Array<{
    id: string;
    filename: string;
    filesize: number;
    mime_type: string;
    status: string;
    created_at: string;
    file_url: string;
  }>;
  total: number;
}

export interface Stats {
  total_files: number;
  total_storage_bytes: number;
  total_storage_gb: number;
  account_created: string;
}

export interface UDCShareConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UDCShareService {
  private apiKey: string = '';
  private baseUrl: string = 'https://udcshare.com/api/v1';
  private config: UDCShareConfig;

  constructor(private http: HttpClient) {}

  /**
   * Configure le service avec vos informations UDCShare
   */
  configure(config: UDCShareConfig): void {
    this.config = config;
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://udcshare.com/api/v1';
  }

  /**
   * Upload un fichier vers UDCShare
   */
  uploadFile(file: File, options: UploadOptions = {}): Observable<UploadResult> {
    if (!this.apiKey) {
      return throwError(() => new Error('Clé API requise'));
    }

    const formData = new FormData();
    formData.append('file', file);

    const request = new HttpRequest('POST', `${this.baseUrl}/upload`, formData, {
      headers: {
        'X-API-Key': this.apiKey
      },
      reportProgress: options.reportProgress || false,
      observe: options.observe || 'body'
    });

    return this.http.request<UploadResult>(request).pipe(
      map((event) => {
        if (event instanceof HttpResponse) {
          return event.body as UploadResult;
        }
        if (event.type === HttpEventType.UploadProgress) {
          return event as any; // Retourne l'event de progression
        }
        return event as any;
      }),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Upload multiple fichiers
   */
  uploadMultiple(files: File[], options: UploadOptions = {}): Observable<UploadResult[]> {
    const uploads = files.map(file => this.uploadFile(file, options));
    
    return new Observable<UploadResult[]>(observer => {
      const results: UploadResult[] = [];
      
      let completed = 0;
      uploads.forEach(upload$ => {
        upload$.subscribe({
          next: (result) => {
            if (result instanceof HttpResponse) {
              results.push(result.body as UploadResult);
            }
          },
          error: (err) => {
            console.error('Erreur upload:', err);
            results.push({
              file_id: '',
              filename: '',
              filesize: 0,
              file_url: '',
              created_at: '',
              plan: '',
              upload_time: 0
            } as any);
          },
          complete: () => {
            completed++;
            if (completed === files.length) {
              observer.next(results);
              observer.complete();
            }
          }
        });
      });
    });
  }

  /**
   * Lister les fichiers uploadés
   */
  listFiles(): Observable<FilesResponse> {
    if (!this.apiKey) {
      return throwError(() => new Error('Clé API requise'));
    }

    return this.http.get<FilesResponse>(`${this.baseUrl}/files`, {
      headers: {
        'X-API-Key': this.apiKey
      }
    }).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Supprimer un fichier
   */
  deleteFile(fileId: string): Observable<void> {
    if (!this.apiKey) {
      return throwError(() => new Error('Clé API requise'));
    }

    return this.http.delete<void>(`${this.baseUrl}/files/${fileId}`, {
      headers: {
        'X-API-Key': this.apiKey
      }
    }).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Obtenir les statistiques
   */
  getStats(): Observable<Stats> {
    if (!this.apiKey) {
      return throwError(() => new Error('Clé API requise'));
    }

    return this.http.get<Stats>(`${this.baseUrl}/stats`, {
      headers: {
        'X-API-Key': this.apiKey
      }
    }).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Obtenir les informations du compte
   */
  getAccountInfo(): Observable<any> {
    if (!this.apiKey) {
      return throwError(() => new Error('Clé API requise'));
    }

    return this.http.get(`${this.baseUrl}/account`, {
      headers: {
        'X-API-Key': this.apiKey
      }
    }).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Valider un fichier avant upload
   */
  static validateFile(file: File, maxSize: number = 25 * 1024 * 1024 * 1024): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'Aucun fichier fourni' };
    }

    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `Fichier trop grand (${this.formatBytes(file.size)} > ${this.formatBytes(maxSize)})` 
      };
    }

    return { valid: true };
  }

  /**
   * Formater une taille en bytes
   */
  static formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;

    for (let i = 0; size >= 1024 && i < units.length - 1; i++) {
      size /= 1024;
    }

    return `${Math.round(size * 100) / 100} ${units[Math.min(units.length - 1, Math.floor(Math.log2(bytes) / 10))]}`;
  }

  /**
   * Gérer les erreurs de l'API
   */
  private handleError(error: any): Observable<never> {
    console.error('UDCShare API Error:', error);

    if (error.status === 401) {
      return throwError(() => new Error('Clé API invalide ou expirée'));
    }

    if (error.status === 403) {
      return throwError(() => new Error('Accès refusé (vérifiez votre plan)'));
    }

    if (error.status === 413) {
      return throwError(() => new Error('Fichier trop grand pour votre plan'));
    }

    if (error.status === 429) {
      return throwError(() => new Error('Trop de requêtes, veuillez attendre'));
    }

    if (error.error && error.error.error) {
      return throwError(() => new Error(error.error.error));
    }

    return throwError(() => new Error('Erreur inconnue'));
  }
}
