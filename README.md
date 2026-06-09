# 🅰️ UDCShare Angular Upload Module

Module Angular professionnel pour intégrer l'API UDCShare dans vos applications Angular.

## 🎯 Cas d'usage

- Applications Angular 15+ avec Standalone Components
- Applications Angular avec NgModule
- Applications Ionic avec Angular
- Server-Side Rendering (SSR)

## 🏗️ Architecture

```
angular-upload-module/
├── src/
│   ├── lib/
│   │   ├── udcshare-upload.component.ts  # Composant principal
│   │   ├── udcshare-upload.component.html
│   │   ├── udcshare-upload.component.css
│   │   ├── drag-drop-zone.component.ts   # Zone drag & drop
│   │   ├── progress-bar.component.ts     # Barre de progression
│   │   ├── file-list.component.ts        # Liste des fichiers
│   │   ├── services/
│   │   │   ├── udcshare.service.ts       # Service API
│   │   │   └── udcshare-http.service.ts  # Service HTTP
│   │   ├── models/
│   │   │   ├── upload.model.ts           # Models TypeScript
│   │   │   └── api-response.model.ts
│   │   ├── interfaces/
│   │   │   ├── upload-options.interface.ts
│   │   │   └── upload-result.interface.ts
│   │   ├── pipes/
│   │   │   └── file-size.pipe.ts         # Pipe pour taille fichier
│   │   └── udcshare.module.ts            # Module principal
│   ├── examples/
│   │   ├── basic-example.component.ts    # Exemple simple
│   │   ├── ngrx-example.component.ts      # Exemple NgRx
│   │   └── guard-example.component.ts    # Exemple avec Guard
│   └── index.ts
├── package.json                # Dépendances
├── tsconfig.json              # Configuration TypeScript
├── ng-package.json            # Configuration Angular Library
└── README.md                  # Ce fichier
```

## 🚀 Installation

```bash
# npm
npm install @udcshare/angular-upload

# yarn
yarn add @udcshare/angular-upload

# pnpm
pnpm add @udcshare/angular-upload
```

## 💻 Utilisation

### Angular 15+ - Standalone Components

```typescript
import { Component } from '@angular/core';
import { UDCShareUploadComponent } from '@udcshare/angular-upload';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [UDCShareUploadComponent],
  template: `
    <udcshare-upload
      [apiKey]="apiKey"
      (uploadSuccess)="onSuccess($event)"
      (uploadError)="onError($event)"
    />
  `
})
export class UploadComponent {
  apiKey = 'votre_clé_api_udcshare';

  onSuccess(result: UploadResult) {
    console.log('Upload réussi:', result);
  }

  onError(error: Error) {
    console.error('Erreur:', error);
  }
}
```

### NgModule - Importation classique

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UDCShareModule } from '@udcshare/angular-upload';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    UDCShareModule.forRoot({
      apiKey: 'votre_clé_api_udcshare',
      baseUrl: 'https://udcshare.com/api/v1'
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### Service Injection

```typescript
import { Component } from '@angular/core';
import { UDCShareService } from '@udcshare/angular-upload';

@Component({
  selector: 'app-upload',
  template: `
    <input type="file" (change)="handleFileChange($event)" />
  `
})
export class UploadComponent {
  constructor(private udcshare: UDCShareService) {}

  handleFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files![0];
    
    this.udcshare.uploadFile(file).subscribe({
      next: (result) => console.log('Upload:', result),
      error: (err) => console.error('Erreur:', err)
    });
  }
}
```

### RxJS avec Progress

```typescript
import { Component } from '@angular/core';
import { UDCShareService } from '@udcshare/angular-upload';

@Component({
  selector: 'app-upload',
  template: `
    <progress [value]="progress" max="100"></progress>
  `
})
export class UploadComponent {
  progress = 0;

  constructor(private udcshare: UDCShareService) {}

  uploadWithProgress(file: File) {
    this.udcshare.uploadFile(file, { observe: 'events' }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.progress = Math.round(100 * event.loaded / event.total!);
        } else if (event.type === HttpEventType.Response) {
          this.progress = 100;
          console.log('Upload complet:', event.body);
        }
      },
      error: (err) => console.error('Erreur:', err)
    });
  }
}
```

## 🎨 Props du composant

### Inputs

| Input | Type | Défaut | Description |
|-------|------|--------|-------------|
| apiKey | string | requis | Votre clé API UDCShare |
| multiple | boolean | false | Permettre multiple fichiers |
| maxFiles | number | 10 | Maximum de fichiers |
| accept | string[] | - | Extensions acceptées |
| maxSize | number | 25GB | Taille max par fichier |
| autoUpload | boolean | true | Upload automatique |
| theme | ThemeConfig | default | Configuration du thème |

### Outputs

| Output | Payload | Description |
|--------|---------|-------------|
| uploadSuccess | UploadResult | Émis quand upload réussi |
| uploadError | Error | Émis quand erreur |
| uploadProgress | ProgressEvent | Émis pendant progression |

## 🔧 Configuration

### ForRoot configuration

```typescript
import { UDCShareModule } from '@udcshare/angular-upload';

@NgModule({
  imports: [
    UDCShareModule.forRoot({
      apiKey: 'votre_clé_api',
      baseUrl: 'https://udcshare.com/api/v1',
      timeout: 30000,
      retryAttempts: 3
    })
  ]
})
export class AppModule { }
```

### Thème personnalisé

```typescript
const customTheme = {
  primary: '#4CAF50',
  secondary: '#2196F3',
  error: '#f44336',
  success: '#4CAF50',
  borderRadius: '8px'
};

<udcshare-upload [theme]="customTheme" />
```

## 🎯 Intégration NgRx

```typescript
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { uploadFile } from './store/upload.actions';

@Component({
  selector: 'app-upload',
  template: `
    <input type="file" (change)="handleFileChange($event)" />
  `
})
export class UploadComponent {
  constructor(private store: Store) {}

  handleFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files![0];
    this.store.dispatch(uploadFile({ file }));
  }
}
```

## 📊 Services

### UDCShareService

```typescript
@Injectable({
  providedIn: 'root'
})
export class UDCShareService {
  uploadFile(file: File, options?: UploadOptions): Observable<UploadResult>;
  uploadMultiple(files: File[], options?: UploadOptions): Observable<UploadResult[]>;
  listFiles(): Observable<FilesResponse>;
  deleteFile(fileId: string): Observable<void>;
  getStats(): Observable<Stats>;
}
```

## 🧪 Tests

```bash
# Tests Karma/Jasmine
npm test

# Tests avec coverage
ng test --code-coverage

# Tests e2e
ng e2e
```

## 📄 License

MIT License

---

**Support:** support@udcshare.com
