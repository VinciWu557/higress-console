---
title: Request Blocking
keywords: [higress,request block]
description: Request blocking plugin configuration reference
---
## Function Description
The `request-block` plugin implements HTTP request blocking based on features such as URL, request headers, etc. It can be used to protect certain site resources from being exposed to the outside.

## Running Attributes
Plugin Execution Stage: `Authentication Stage`

Plugin Execution Priority: `320`

## Configuration Fields
| Name              | Data Type       | Filling Requirement                                                                                                             | Default Value | Description                                                                                 |
| ----------------- | --------------- | -------------------------------------------------------------------------------------------------------------------             | ------------- | ------------------------------------------------                                            |
| block_urls        | array of string | Optional, at least one of `block_urls`, `block_exact_urls`, `block_regexp_urls`, `block_headers`, `block_bodies` must be filled | -             | Configure strings for matching URLs to be blocked                                           |
| block_exact_urls  | array of string | Optional, at least one of `block_urls`, `block_exact_urls`, `block_regexp_urls`, `block_headers`, `block_bodies` must be filled | -             | Configure strings for exactly matching URLs to be blocked                                   |
| block_regexp_urls | array of string | Optional, at least one of `block_urls`, `block_exact_urls`, `block_regexp_urls`, `block_headers`, `block_bodies` must be filled | -             | Configure regular expressions for matching URLs to be blocked                               |
| block_headers     | array of string | Optional, at least one of `block_urls`, `block_exact_urls`, `block_regexp_urls`, `block_headers`, `block_bodies` must be filled | -             | Configure strings for matching request headers to be blocked                                |
| block_bodies      | array of string | Optional, at least one of `block_urls`, `block_exact_urls`, `block_regexp_urls`, `block_headers`, `block_bodies` must be filled | -             | Configure strings for matching request bodies to be blocked                                 |
| blocked_code      | number          | Optional                                                                                                                        | 403           | Configure the HTTP status code to return when a request is blocked                          |
| blocked_message   | string          | Optional                                                                                                                        | -             | Configure the HTTP response body to return when a request is blocked                        |
| case_sensitive    | bool            | Optional                                                                                                                        | true          | Configure whether case sensitivity is considered during matching, default is case-sensitive |

## Configuration Example
### Blocking Request URL Paths
```yaml
block_urls:
- swagger.html
- foo=bar
case_sensitive: false
```

Based on this configuration, the following requests will be denied access:
```bash
curl http://example.com?foo=Bar
curl http://exmaple.com/Swagger.html
```

### Block requests with exact URL path matches

```yaml
block_exact_urls:
- /swagger.html?foo=bar
case_sensitive: false
```

Based on this configuration, the following request will be blocked:

```bash
curl http://exmaple.com/Swagger.html?foo=Bar
```

### Block requests with URL path regex matches

```yaml
block_exact_urls:
- .*swagger.*
case_sensitive: false
```

Based on this configuration, the following request will be blocked:

```bash
curl http://exmaple.com/Swagger.html?foo=Bar
```

### Blocking Request Headers
```yaml
block_headers:
- example-key
- example-value
```

Based on this configuration, the following requests will be denied access:
```bash
curl http://example.com -H 'example-key: 123'
curl http://exmaple.com -H 'my-header: example-value'
```

### Blocking Request Bodies
```yaml
block_bodies:
- "hello world"
case_sensitive: false
```

Based on this configuration, the following requests will be denied access:
```bash
curl http://example.com -d 'Hello World'
curl http://exmaple.com -d 'hello world'
```

## Request Body Size Limit
When `block_bodies` is configured, only request bodies smaller than 32 MB are supported for matching. If the request body exceeds this limit and there are no matching `block_urls` or `block_headers`, the blocking operation will not be executed for that request.

When `block_bodies` is configured and the request body exceeds the global configuration DownstreamConnectionBufferLimits, it will return `413 Payload Too Large`.
