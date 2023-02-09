# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.0.2](https://github.com/es-shims/iterator-helpers/compare/v1.0.1...v1.0.2) - 2023-02-09

### Commits

- [Refactor] inline 2023 impls of Iterator AOs until es-abstract is published with them [`b9c80c5`](https://github.com/es-shims/iterator-helpers/commit/b9c80c5aba0deaaabef7e650fe7ec231fdc695e3)
- [Fix] ensure calling `.return` does not invoke the next iteration [`9e28ed5`](https://github.com/es-shims/iterator-helpers/commit/9e28ed5af44a660a0d2e80684cb9a4bf3d86e09a)
- [Fix] `map`: pass the proper index argument to the mapper [`125e3ca`](https://github.com/es-shims/iterator-helpers/commit/125e3cac192ef650a88f774a5a2dd9afe395a5b8)
- [Deps] update `internal-slot` [`43351b6`](https://github.com/es-shims/iterator-helpers/commit/43351b63545e3698f54daf5dc0652a7b2fb7cb28)

## [v1.0.1](https://github.com/es-shims/iterator-helpers/compare/v1.0.0...v1.0.1) - 2023-02-07

### Commits

- [Fix] `Iterator`: throw when Iterator() is called without new [`a6fc7e7`](https://github.com/es-shims/iterator-helpers/commit/a6fc7e768cbf4d43117365ec2f1bd300247d8dfd)

## v1.0.0 - 2023-02-05

### Commits

- Initial implementation, tests, readme [`650713e`](https://github.com/es-shims/iterator-helpers/commit/650713eecc9d4dab28d5ba3dc5afcbdb8ff99b5a)
- Initial commit [`2379dfd`](https://github.com/es-shims/iterator-helpers/commit/2379dfdad70f64efb31e342a4a7779b1140b2481)
- npm init [`f77411a`](https://github.com/es-shims/iterator-helpers/commit/f77411a443f1a103dbb92a69210228d4fc1e6d04)
- Only apps should have lockfiles [`313dcf5`](https://github.com/es-shims/iterator-helpers/commit/313dcf5211e99569ad275885728b5ac7af30f4ec)
