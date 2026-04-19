export type EmailProviderKey =
  | 'gmail'
  | 'outlook'
  | 'yahoo'
  | 'icloud'
  | 'zoho'
  | 'fastmail'
  | 'other'

export interface EmailProviderPreset {
  key: EmailProviderKey
  label: string
  imapHost: string
  imapPort: number
  imapSecure: boolean
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  helpUrl?: string
  helpText?: string
}

export const EMAIL_PROVIDERS: Array<EmailProviderPreset> = [
  {
    key: 'gmail',
    label: 'Gmail',
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpSecure: true,
    helpUrl: 'https://myaccount.google.com/apppasswords',
    helpText:
      'Enable 2-Step Verification, then generate an App Password. A regular Gmail password will not work.',
  },
  {
    key: 'outlook',
    label: 'Outlook / Office 365',
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    smtpSecure: false,
    helpUrl: 'https://account.live.com/proofs/AppPassword',
    helpText:
      'Generate an app password in your Microsoft account security settings. SMTP uses STARTTLS on port 587.',
  },
  {
    key: 'yahoo',
    label: 'Yahoo',
    imapHost: 'imap.mail.yahoo.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.mail.yahoo.com',
    smtpPort: 465,
    smtpSecure: true,
    helpText:
      'Generate an app password in Yahoo Account Security → Generate app password.',
  },
  {
    key: 'icloud',
    label: 'iCloud',
    imapHost: 'imap.mail.me.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.mail.me.com',
    smtpPort: 587,
    smtpSecure: false,
    helpUrl: 'https://appleid.apple.com',
    helpText:
      'Generate an app-specific password at appleid.apple.com. SMTP uses STARTTLS on port 587.',
  },
  {
    key: 'zoho',
    label: 'Zoho',
    imapHost: 'imap.zoho.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.zoho.com',
    smtpPort: 465,
    smtpSecure: true,
  },
  {
    key: 'fastmail',
    label: 'Fastmail',
    imapHost: 'imap.fastmail.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.fastmail.com',
    smtpPort: 465,
    smtpSecure: true,
  },
  {
    key: 'other',
    label: 'Other',
    imapHost: '',
    imapPort: 993,
    imapSecure: true,
    smtpHost: '',
    smtpPort: 465,
    smtpSecure: true,
  },
]
