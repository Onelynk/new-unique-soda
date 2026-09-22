import { ShopInfo } from '../types';

/**
 * Generates and triggers download of a standardized vCard (.vcf) file
 * compatible with iOS and Android address books.
 */
export function downloadVCard(info: ShopInfo) {
  const vcardContent = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${info.name}`,
    `ORG:${info.legalName}`,
    `TITLE:Artisanal Soda Bar & Beverage Studio`,
    `TEL;TYPE=WORK,VOICE:${info.phone}`,
    `TEL;TYPE=CELL,VOICE:${info.phone}`,
    `ADR;TYPE=WORK:;;${info.address};${info.city};;${info.pinCode};India`,
    `URL:${window.location.origin}`,
    `NOTE:${info.tagline} - ${info.subtitle}`,
    'END:VCARD',
  ].join('\r\n');

  const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${info.name.replace(/\s+/g, '_')}_Card.vcf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
