/** Human-readable admin social publish errors. */
export function formatPostError(error: string): string {
  switch (error) {
    case "already_posted":
      return "Already published for this content.";
    case "no_content":
      return "Not enough qualifying content to publish yet.";
    case "chart_failed":
      return "Chart render failed — check server logs.";
    case "disabled":
      return "X API is disabled — set X_API_ENABLED=true in env.";
    case "invalid_input":
      return "Invalid request — check inputs and try again.";
    case "call_id_and_milestone_required":
      return "Call ID and milestone are required.";
    case "call_id_required":
      return "Call ID is required.";
    default:
      return error.startsWith("http_") || error === "no_token"
        ? `X API error: ${error}`
        : "Publish failed.";
  }
}
