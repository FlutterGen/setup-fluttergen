<div align="center">

# setup-fluttergen

Install `fluttergen` command in GitHub Actions.

</div>

# Usage

```yaml
- uses: FluttterGen/setup-fluttergen@v1
  with:
    version: 5.6.0
```

# Inputs

| Name       | Description                                                                                                    | Required | Default                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------- |
| version    | FlutterGen version (optional, will be detected from project root .tool-versions or .mise.toml if not provided) | false    | -                                                               |
| cache      | Cache FlutterGen CLI                                                                                           | false    | true                                                            |
| cache-key  | Cache key for FlutterGen CLI                                                                                   | false    | `fluttergen-${{ runner.os }}-${{ runner.arch }}-${{ version }}` |
| cache-path | Cache path for FlutterGen CLI                                                                                  | false    | `${{ runner.tool_cache }}/.fluttergen`                          |

# Outputs

| Name    | Description                  |
| ------- | ---------------------------- |
| version | Installed FlutterGen version |
