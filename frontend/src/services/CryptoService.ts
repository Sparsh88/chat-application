/**
 * CryptoService.ts
 * Browser-side End-to-End Encryption (E2EE) using Web Crypto API.
 * Performs ECDH key exchange and AES-GCM encryption.
 */

export class CryptoService {
  
  // Generate ECDH (P-256) Key Pair
  static async generateKeyPair(): Promise<CryptoKeyPair> {
    return await window.crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true, // extractable
      ['deriveKey', 'deriveBits']
    );
  }

  // Export Public Key to Base64 String to publish it to other peers
  static async exportPublicKey(publicKey: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey('spki', publicKey);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }

  // Import peer's Public Key from Base64 String
  static async importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
    const binaryDerString = atob(publicKeyBase64);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
      binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    return await window.crypto.subtle.importKey(
      'spki',
      binaryDer.buffer,
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true,
      []
    );
  }

  // Derive Shared Secret Key (AES-GCM 256 bits) from own Private Key + peer's Public Key
  static async deriveSharedKey(
    ownPrivateKey: CryptoKey,
    peerPublicKey: CryptoKey
  ): Promise<CryptoKey> {
    return await window.crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: peerPublicKey
      },
      ownPrivateKey,
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  // Encrypt cleartext message using derived shared key
  static async encryptMessage(
    text: string,
    sharedKey: CryptoKey
  ): Promise<{ ciphertext: string; iv: string }> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Generate a random 12-byte IV for AES-GCM
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      sharedKey,
      data
    );

    const ciphertextBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    const ivBase64 = btoa(String.fromCharCode(...iv));

    return {
      ciphertext: ciphertextBase64,
      iv: ivBase64
    };
  }

  // Decrypt encrypted message using derived shared key
  static async decryptMessage(
    ciphertextBase64: string,
    ivBase64: string,
    sharedKey: CryptoKey
  ): Promise<string> {
    try {
      // Decode ciphertext
      const ciphertextDerString = atob(ciphertextBase64);
      const ciphertext = new Uint8Array(ciphertextDerString.length);
      for (let i = 0; i < ciphertextDerString.length; i++) {
        ciphertext[i] = ciphertextDerString.charCodeAt(i);
      }

      // Decode IV
      const ivDerString = atob(ivBase64);
      const iv = new Uint8Array(ivDerString.length);
      for (let i = 0; i < ivDerString.length; i++) {
        iv[i] = ivDerString.charCodeAt(i);
      }

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        sharedKey,
        ciphertext.buffer
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed, key mismatch or corrupted payload:', error);
      if (ciphertextBase64 && !ciphertextBase64.startsWith('ey') && ciphertextBase64.length < 200 && !/^[A-Za-z0-9+/=]+$/.test(ciphertextBase64)) {
        return ciphertextBase64;
      }
      return '🔑 [Decryption Error: Key Mismatch or corrupt payload]';
    }
  }

  // Helper: Generates a static key pair for a user based on their password/token to mock E2EE if browser doesn't persist keyPair
  // Storing keys in LocalStorage as raw strings
  static async getStoredKeyPair(userId: string): Promise<CryptoKeyPair> {
    const cachedPrivate = localStorage.getItem(`e2ee_private_${userId}`);
    const cachedPublic = localStorage.getItem(`e2ee_public_${userId}`);

    if (cachedPrivate && cachedPublic) {
      const importPriv = await window.crypto.subtle.importKey(
        'pkcs8',
        new Uint8Array(atob(cachedPrivate).split('').map(c => c.charCodeAt(0))).buffer,
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveKey', 'deriveBits']
      );

      const importPub = await this.importPublicKey(cachedPublic);
      return { publicKey: importPub, privateKey: importPriv };
    }

    const newKeyPair = await this.generateKeyPair();
    
    // Save to storage
    const exportedPrivate = await window.crypto.subtle.exportKey('pkcs8', newKeyPair.privateKey);
    const privateBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedPrivate)));
    const publicBase64 = await this.exportPublicKey(newKeyPair.publicKey);

    localStorage.setItem(`e2ee_private_${userId}`, privateBase64);
    localStorage.setItem(`e2ee_public_${userId}`, publicBase64);

    return newKeyPair;
  }
}
