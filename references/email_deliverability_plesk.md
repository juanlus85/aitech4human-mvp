# Deliverability checklist for `research.blancoguzman.es`

The application now uses a consistent display name, `Reply-To`, a valid domain-based `Message-ID`, and absolute links to `https://research.blancoguzman.es`. These code-level measures help, but **the main determinant of spam placement is domain and SMTP-server authentication**. Google recommends configuring SPF, DKIM, and DMARC for all sending domains; Microsoft likewise treats the three protocols as complementary authentication controls.[1][2]

> Do not create a second SPF record. A domain must have **one** SPF TXT record containing every legitimate sender.

## 1. Align the Plesk mailbox and sender

Use a real mailbox such as `research@blancoguzman.es` both as the SMTP login (or a permitted sender) and as the **From** address configured in the application. In **Admin → Settings → SMTP**, set `SMTP From` to:

```text
AI&Tech4Human Research & Innovation Group <research@blancoguzman.es>
```

If replies should go to another mailbox, use that address as `smtp_reply_to`; otherwise replies stay at `research@blancoguzman.es`. Keeping the visible From domain aligned with the SMTP sending domain is important for DMARC.[2]

## 2. Publish SPF

In the DNS zone for `blancoguzman.es`, create or update the single TXT record at the root (`@`). Replace the placeholder with the **public outbound IP of the Plesk SMTP server**. If another provider also sends mail for this domain, its documented `include:` entry must be added to the same record.

```dns
@  TXT  "v=spf1 a mx ip4:YOUR_PLESK_OUTBOUND_IP ~all"
```

After confirming that every sender is listed and mail passes SPF, `~all` can be changed to `-all`. SPF authorizes the mail sources allowed to send for the domain.[1][2]

## 3. Enable DKIM in Plesk

In Plesk, open the mail settings for `blancoguzman.es` and enable **DKIM signing of outgoing messages**. Plesk will show one or more TXT records (selector plus public key). Copy the record exactly into the authoritative DNS zone; do not invent the selector or key manually. A 2048-bit key is preferable when supported.[1]

Then send a test to Gmail or Outlook and inspect the message headers. DKIM should show `pass` and the signing domain should be `blancoguzman.es`.

## 4. Publish DMARC in monitoring mode

Create a mailbox able to receive aggregate reports, for example `dmarc@blancoguzman.es`, then add:

```dns
_dmarc  TXT  "v=DMARC1; p=none; rua=mailto:dmarc@blancoguzman.es; adkim=s; aspf=s; pct=100"
```

Leave `p=none` while reviewing reports and confirming all legitimate sources pass SPF or DKIM with the same From domain. Once validated, move gradually to `p=quarantine` and, if appropriate, `p=reject`. DMARC checks alignment between the visible From domain and the domain authenticated by SPF or DKIM.[1][2]

## 5. Check the outbound server reputation

Ask the hosting provider to confirm that the Plesk SMTP IP has a correct reverse-DNS/PTR record and that the matching hostname resolves back to the same IP. Google identifies forward and reverse DNS consistency as an infrastructure requirement for sending servers.[1]

Finally, send a real platform message to Gmail and Outlook, inspect the full headers, and confirm all of the following:

| Check | Expected result |
|---|---|
| SPF | `pass` for an authorized sending source |
| DKIM | `pass` with `d=blancoguzman.es` |
| DMARC | `pass` with `header.from=blancoguzman.es` |
| From / Reply-To | A real `@blancoguzman.es` mailbox |
| Link targets | `https://research.blancoguzman.es/...` |

Recipients can also mark an early legitimate message as **Not spam** or add `research@blancoguzman.es` to contacts. This helps recipient-specific reputation, but it does not replace SPF, DKIM, DMARC, and correct reverse DNS.[1]

## References

[1]: https://support.google.com/mail/answer/81126?hl=en "Google Gmail — Email sender guidelines"
[2]: https://learn.microsoft.com/en-us/defender-office-365/email-authentication-about "Microsoft Learn — Email authentication in cloud organizations"
