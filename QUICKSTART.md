# 🚀 Quick Start

## Instalación Rápida

```bash
# 1. Instalar dependencias
npm install

# 2. Construir extensión
npm run build

# 3. Cargar en Chrome
# - Abre chrome://extensions/
# - Activa "Modo de desarrollador"
# - Click en "Cargar extensión sin empaquetar"
# - Selecciona la carpeta 'dist/'
```

## Estructura Final del Proyecto

```
seneca-vue-chrome-extension/
├── src/
│   ├── components/          # Componentes Vue
│   │   ├── Toolbar.vue
│   │   └── UploadModal.vue
│   ├── content/             # Content scripts
│   │   ├── index.ts         # Script principal
│   │   ├── DownloadHandler.ts
│   │   └── UploadHandler.ts
│   ├── services/            # Servicios de negocio
│   │   ├── SenecaAPIService.ts
│   │   └── TableParserService.ts
│   ├── types/               # Interfaces TypeScript
│   │   └── index.ts
│   └── utils/               # Utilidades
│       └── CSVUtils.ts
├── public/
│   ├── icons/               # Iconos de la extensión
│   └── manifest.json        # Manifest V3
├── dist/                    # Output del build
├── tsconfig.json            # Config TypeScript
├── vite.config.js           # Config Vite
└── package.json

```

## Archivos Importantes

### manifest.json

```json
{
  "manifest_version": 3,
  "name": "Seneca Extension",
  "content_scripts": [
    {
      "matches": ["https://seneca.juntadeandalucia.es/*"],
      "js": ["content.js"]
    }
  ]
}
```

### package.json - Scripts

```json
{
  "scripts": {
    "build": "vue-tsc --noEmit && vite build && npm run copy-assets",
    "copy-assets": "cp -r public/* dist/",
    "type-check": "vue-tsc --noEmit"
  }
}
```

## Comandos Disponibles

| Comando              | Descripción               |
| -------------------- | ------------------------- |
| `npm install`        | Instala dependencias      |
| `npm run build`      | Compila para producción   |
| `npm run type-check` | Verifica tipos TypeScript |

## Uso

1. **Navegar a Seneca**: https://seneca.juntadeandalucia.es/
2. **Ir al Cuaderno de Clase**
3. **Usar botones**:
   - **Descargar CSV**: Exporta tabla actual
   - **Subir CSV**: Importa y sube calificaciones

## Formato CSV

```csv
Alumno/a;Actividad 1;Actividad 2;Actividad 3
García López, Juan;8.5;9.0;7.5
Pérez Martínez, María;9.5;8.0;9.0
```

**Importante**:

- Usa `;` como separador
- Primera columna: nombre del estudiante
- Valores numéricos para las notas

## Tecnologías

- ⚡ **Vite** - Build tool
- 🎨 **Vue 3** - Framework UI
- 📘 **TypeScript** - Tipado estático
- 🔧 **Chrome Extensions API** - Manifest V3

## Stack Técnico

### Frontend

- Vue 3 Composition API
- TypeScript con strict mode
- Componentes SFC (Single File Components)

### Build

- Vite para bundling
- vue-tsc para type checking
- Rollup para optimización

### Arquitectura

- Servicios para lógica de negocio
- Handlers para coordinación
- Componentes para UI
- Tipos e interfaces centralizados

## Ventajas sobre la Versión JavaScript

✅ **Type Safety**: Errores detectados en compilación  
✅ **Mejor DX**: Autocomplete y documentación inline  
✅ **Mantenible**: Código organizado y modular  
✅ **Testable**: Separación de responsabilidades  
✅ **Escalable**: Fácil agregar nuevas features

## Documentación Adicional

- [README.md](./README.md) - Documentación completa
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detalles técnicos
- [MIGRATION.md](./MIGRATION.md) - Guía de migración

## Troubleshooting

### Error: "Cannot find module '@/types'"

```bash
npm run build
```

### Error en Chrome: "Manifest file is missing or unreadable"

Verifica que `dist/manifest.json` existe después del build.

### Extensión no aparece en Seneca

Verifica que:

1. Estás en `https://seneca.juntadeandalucia.es/*`
2. La página es "CUADERNO DE CLASE"
3. Hay una tabla visible

## Desarrollo

Para hacer cambios:

1. Modifica archivos en `src/`
2. Ejecuta `npm run build`
3. Recarga la extensión en Chrome
4. Recarga la página de Seneca

## Soporte

Para problemas o preguntas, revisa la documentación en:

- [README.md](./README.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)

---

**Versión**: 1.0.0  
**Última actualización**: Diciembre 2025
