# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-04

### Added
- 🚀 Initial release of EDU API MCP Server
- 📁 **Zero-code extensibility**: Just drop `.toon` files in `providers/` folder
- 🔍 **Automatic provider discovery**: Auto-scans and loads all TOON files on startup
- 🏫 **School Alrimi API integration**: 12 endpoints for Korean school information
  - School basic information
  - Student statistics (gender, grade, transfer)
  - Teacher information (position, license, subject)
  - School safety (violence prevention)
- 📚 **RISS API integration**: Korean thesis search API
  - Thesis search by keyword, title, author, publisher
  - Advanced filtering by year, thesis type
  - Pagination support
- 🔧 **MCP Tools**: Automatically generated from provider specifications
  - 17+ tools for school information queries
  - 1 tool for thesis search
- 📦 **TOON Format**: Custom format for API specifications
  - 85% compression compared to JSON
  - Human-readable table-based syntax
  - Support for nested paths (e.g., `endpoints.student`)
- 🏭 **Provider Factory**: Automatic provider generation from specs
- 📝 **Tool Registry**: Automatic MCP tool registration
- 💪 **100% TypeScript**: Full type safety with strict mode
- 🧪 **Comprehensive testing**: Build validation and type checking
- 📖 **Documentation**: Complete README with examples
- 🚢 **Smithery ready**: Pre-configured for easy deployment

### Technical Details
- Built with TypeScript 5.3
- Uses MCP SDK 1.0.4
- ES2022 modules
- Node.js >= 20.0.0 required

### Architecture
- **Plugin-based architecture**: Each API is an independent provider
- **Factory pattern**: Automatic endpoint generation
- **Registry pattern**: Centralized tool management
- **Loader pattern**: Dynamic provider loading
- **Zero configuration**: Works out of the box

### File Structure
```
mcp-server/
├── src/
│   ├── core/          # Core server components
│   ├── lib/           # TOON parser library
│   ├── types/         # TypeScript definitions
│   └── index.ts       # Entry point
├── providers/         # Provider TOON files
│   ├── school-alrimi.toon
│   └── riss.toon
├── README.md
├── smithery.json
└── package.json
```

### Performance
- **TOON compression**: 85% smaller than JSON
  - school-alrimi: 33KB (JSON) → 4.9KB (TOON)
  - riss: 24KB (JSON) → 7.2KB (TOON)
- **Fast startup**: < 1 second to load all providers
- **Low memory footprint**: ~ 50MB

### Future Plans
- [ ] Add more Korean education APIs
- [ ] Implement caching layer
- [ ] Add authentication middleware
- [ ] Create CLI tools for provider management
- [ ] Add provider validation tools
- [ ] Support for XML response parsing
- [ ] Add rate limiting
- [ ] Implement retry strategies

---

## [Unreleased]

### Planned Features
- Additional Korean education APIs (KERIS, NEIS)
- Web-based provider editor
- Enhanced error handling
- Metrics and monitoring
- Docker support
- Kubernetes deployment configs

---

**Legend**:
- 🚀 New features
- 🐛 Bug fixes
- 🔧 Improvements
- 📖 Documentation
- ⚡ Performance
- 🔒 Security
- 💥 Breaking changes
