# New Repository Structure Recommendation

## Overview

Based on the experience with the current repository, it would be beneficial to create a new, clean repository with a more organized structure that separates deeds and permits processing while sharing common code. This document outlines the recommended structure for this new repository.

## Benefits of a New Repository

1. **Cleaner Code Organization**: The current repository has evolved organically, resulting in a mix of scripts and approaches. A new repository would allow for a more thoughtful organization from the start.

2. **Better Separation of Concerns**: Deeds and permits can be handled in separate modules while sharing common utilities and services.

3. **Improved Maintainability**: With a cleaner structure, the code will be easier to maintain and extend in the future.

4. **Consistent Approach**: The new repository can use a consistent approach for both deeds and permits processing, leveraging the lessons learned from the current implementation.

5. **Reduced Technical Debt**: Starting fresh allows us to avoid carrying forward technical debt from the current implementation.

## Proposed Structure

```
deeds-permits-publisher/
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── README.md
├── data/
│   ├── input/
│   │   ├── deeds.csv
│   │   └── permits.csv
│   ├── mapping/
│   │   ├── deed-entity-mapping.json
│   │   └── permit-entity-mapping.json
│   └── output/
│       ├── deed-entity-urls.csv
│       └── permit-entity-urls.csv
├── scripts/
│   ├── create-spaces.ts
│   └── publish-entities.ts
└── src/
    ├── cli/
    │   └── commands/
    │       ├── create-spaces.ts
    │       ├── publish-entities.ts
    │       └── setup-ontology.ts
    ├── config/
    │   └── constants.ts
    ├── core/
    │   └── graph.ts
    ├── models/
    │   ├── base-model.ts
    │   ├── deed.ts
    │   ├── document-type.ts
    │   ├── permit.ts
    │   ├── person.ts
    │   ├── record-type.ts
    │   └── status.ts
    ├── services/
    │   ├── ontology-service.ts
    │   ├── publish-service.ts
    │   └── transaction-service.ts
    └── utils/
        ├── string-utils.ts
        └── wallet.ts
```

## Key Components

### Models

- **BaseModel**: Common base class for all models
- **Deed**: Model for deed records
- **Permit**: Model for permit records
- **Person**: Model for people (direct/indirect names)
- **DocumentType**: Model for document types
- **RecordType**: Model for record types
- **Status**: Model for status values

### Services

- **OntologyService**: Handles setting up the ontology in the GRC-20 spaces
- **PublishService**: Handles publishing entities to GRC-20 spaces
- **TransactionService**: Handles blockchain transactions

### CLI Commands

- **create-spaces**: Command to create GRC-20 spaces
- **publish-entities**: Command to publish entities to GRC-20 spaces
- **setup-ontology**: Command to set up the ontology in GRC-20 spaces

### Scripts

- **create-spaces.ts**: Script to create GRC-20 spaces
- **publish-entities.ts**: Script to publish entities to GRC-20 spaces

## Implementation Approach

1. **Create the new repository** with the structure outlined above
2. **Implement the core models and services** based on the lessons learned from the current implementation
3. **Implement the CLI commands** for creating spaces, setting up ontology, and publishing entities
4. **Add scripts** for common operations
5. **Document the new repository** with a comprehensive README.md

## Migration Plan

1. **Export data** from the current repository
2. **Import data** into the new repository
3. **Verify** that the new implementation produces the same results as the current implementation
4. **Switch** to using the new repository for all future work

## Conclusion

Creating a new repository with a clean, organized structure would be a worthwhile investment. It would make the code more maintainable, easier to understand, and more consistent. The lessons learned from the current implementation can be applied to create a better solution from the start.
