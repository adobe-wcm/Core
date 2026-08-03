As per the report: 90% line of 7.458s means ~90% of requests (78 of 87) completed below 7.458s; only the slowest ~9 requests reached that range. The overall average of 1.321s confirms the majority were fast and normal.
Single-request TTFB on STG dispatcher is ~346ms, so page render itself is healthy. For the 9 slow samples, we are first checking dispatcher cache HIT/MISS correlation (cold cache after deployment) before code-level analysis. Requested the response-time-over-time graph / .jtl from QA to confirm.
@Prakash Kadhati @Rajat Thathoo
