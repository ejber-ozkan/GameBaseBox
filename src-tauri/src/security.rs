use aes_gcm::{
    aead::{rand_core::RngCore, Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce as AesIv,
};
use base64::{engine::general_purpose, Engine as _};
use sha2::{Digest, Sha256};

const ENCRYPTION_FORMAT_V2_PREFIX: &str = "v2:";
const ENCRYPTION_FORMAT_V3_PREFIX: &str = "v3:";
const GCM_NONCE_LENGTH: usize = 12;
#[cfg(not(test))]
const KEYCHAIN_SERVICE: &str = "com.gamebasebox.desktop";
#[cfg(not(test))]
const KEYCHAIN_ACCOUNT: &str = "settings-encryption-key";

fn get_legacy_encryption_key() -> [u8; 32] {
    let uid = machine_uid::get().unwrap_or_else(|_| "fixed-fallback-uid".to_string());
    let mut hasher = Sha256::new();
    hasher.update(uid.as_bytes());
    // Keep the legacy salt stable so existing encrypted settings remain readable.
    hasher.update(b"64Box-Salt-2026");
    let result = hasher.finalize();
    let mut key = [0u8; 32];
    key.copy_from_slice(&result);
    key
}

#[cfg(not(test))]
fn get_encryption_key() -> Result<[u8; 32], String> {
    let entry = keyring::Entry::new(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT)
        .map_err(|error| format!("Unable to access the OS credential store: {error}"))?;
    let encoded = match entry.get_password() {
        Ok(value) => value,
        Err(keyring::Error::NoEntry) => {
            let mut key = [0u8; 32];
            OsRng.fill_bytes(&mut key);
            let value = general_purpose::STANDARD.encode(key);
            entry.set_password(&value)
                .map_err(|error| format!("Unable to save the installation key in the OS credential store: {error}"))?;
            value
        }
        Err(error) => return Err(format!("Unable to read the installation key from the OS credential store: {error}")),
    };
    let decoded = general_purpose::STANDARD
        .decode(encoded)
        .map_err(|error| format!("The OS credential store returned an invalid installation key: {error}"))?;
    decoded.try_into().map_err(|_| "The OS credential store returned an installation key with an invalid length.".to_string())
}

#[cfg(test)]
fn get_encryption_key() -> Result<[u8; 32], String> {
    Ok(get_legacy_encryption_key())
}

pub fn encrypt_value(value: &str) -> Result<String, String> {
    let key = get_encryption_key()?;
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|e| e.to_string())?;

    let mut nonce = [0u8; GCM_NONCE_LENGTH];
    OsRng.fill_bytes(&mut nonce);
    let iv = AesIv::from_slice(&nonce);

    let ciphertext = cipher
        .encrypt(iv, value.as_bytes())
        .map_err(|e| e.to_string())?;

    let mut payload = Vec::with_capacity(GCM_NONCE_LENGTH + ciphertext.len());
    payload.extend_from_slice(&nonce);
    payload.extend_from_slice(&ciphertext);

    Ok(format!(
        "{ENCRYPTION_FORMAT_V3_PREFIX}{}",
        general_purpose::STANDARD.encode(payload)
    ))
}

fn decrypt_legacy_value(encrypted_base64: &str) -> Result<String, String> {
    let key = get_legacy_encryption_key();
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|e| e.to_string())?;

    let ciphertext = general_purpose::STANDARD
        .decode(encrypted_base64)
        .map_err(|e| e.to_string())?;

    let iv_bytes = &key[0..12];
    let iv = AesIv::from_slice(iv_bytes);

    let plaintext = cipher
        .decrypt(iv, ciphertext.as_slice())
        .map_err(|e| e.to_string())?;

    String::from_utf8(plaintext).map_err(|e| e.to_string())
}

pub fn decrypt_value(encrypted_value: &str) -> Result<String, String> {
    if let Some(v3_payload) = encrypted_value.strip_prefix(ENCRYPTION_FORMAT_V3_PREFIX) {
        let key = get_encryption_key()?;
        let cipher = Aes256Gcm::new_from_slice(&key).map_err(|e| e.to_string())?;
        let payload = general_purpose::STANDARD
            .decode(v3_payload)
            .map_err(|e| e.to_string())?;

        if payload.len() < GCM_NONCE_LENGTH {
            return Err("Encrypted payload is missing nonce bytes.".to_string());
        }

        let (nonce, ciphertext) = payload.split_at(GCM_NONCE_LENGTH);
        let plaintext = cipher
            .decrypt(AesIv::from_slice(nonce), ciphertext)
            .map_err(|e| e.to_string())?;

        return String::from_utf8(plaintext).map_err(|e| e.to_string());
    }

    if let Some(v2_payload) = encrypted_value.strip_prefix(ENCRYPTION_FORMAT_V2_PREFIX) {
        let key = get_legacy_encryption_key();
        let cipher = Aes256Gcm::new_from_slice(&key).map_err(|e| e.to_string())?;
        let payload = general_purpose::STANDARD.decode(v2_payload).map_err(|e| e.to_string())?;
        if payload.len() < GCM_NONCE_LENGTH { return Err("Encrypted payload is missing nonce bytes.".to_string()); }
        let (nonce, ciphertext) = payload.split_at(GCM_NONCE_LENGTH);
        let plaintext = cipher.decrypt(AesIv::from_slice(nonce), ciphertext).map_err(|e| e.to_string())?;
        return String::from_utf8(plaintext).map_err(|e| e.to_string());
    }

    decrypt_legacy_value(encrypted_value)
}

pub fn uses_current_encryption_format(value: &str) -> bool {
    value.starts_with(ENCRYPTION_FORMAT_V3_PREFIX)
}

#[cfg(test)]
mod tests {
    use super::*;
    use aes_gcm::{aead::{Aead, KeyInit}, Aes256Gcm, Nonce as AesIv};
    use base64::engine::general_purpose;

    fn encrypt_value_with_legacy_fixed_iv(value: &str) -> String {
        let key = get_legacy_encryption_key();
        let cipher = Aes256Gcm::new_from_slice(&key).unwrap();
        let iv = AesIv::from_slice(&key[0..GCM_NONCE_LENGTH]);
        let ciphertext = cipher.encrypt(iv, value.as_bytes()).unwrap();
        general_purpose::STANDARD.encode(ciphertext)
    }

    #[test]
    fn test_encryption_roundtrip() {
        let original = "secret-key-123";
        let encrypted = encrypt_value(original).expect("Encryption failed");
        assert!(encrypted.starts_with("v3:"));
        let decrypted = decrypt_value(&encrypted).expect("Decryption failed");
        assert_eq!(original, decrypted);
    }

    #[test]
    fn test_encryption_empty_string() {
        let original = "";
        let encrypted = encrypt_value(original).unwrap();
        let decrypted = decrypt_value(&encrypted).unwrap();
        assert_eq!(original, decrypted);
    }

    #[test]
    fn test_encryption_long_string() {
        let original = "A".repeat(1024);
        let encrypted = encrypt_value(&original).unwrap();
        let decrypted = decrypt_value(&encrypted).unwrap();
        assert_eq!(original, decrypted);
    }

    #[test]
    fn test_encryption_uses_unique_nonce_per_value() {
        let original = "secret-key-123";
        let first = encrypt_value(original).expect("first encryption should succeed");
        let second = encrypt_value(original).expect("second encryption should succeed");

        assert_ne!(first, second);
        assert_eq!(decrypt_value(&first).unwrap(), original);
        assert_eq!(decrypt_value(&second).unwrap(), original);
    }

    #[test]
    fn test_decrypt_supports_legacy_fixed_iv_ciphertext() {
        let original = "legacy-secret";
        let encrypted = encrypt_value_with_legacy_fixed_iv(original);

        let decrypted = decrypt_value(&encrypted).expect("legacy ciphertext should still decrypt");
        assert_eq!(decrypted, original);
    }

    #[test]
    fn test_invalid_decrypt() {
        let res = decrypt_value("not-base64");
        assert!(res.is_err());

        // Valid base64 but invalid ciphertext format (too short for GCM, or bad tag)
        let res2 = decrypt_value("SGVsbG8="); // "Hello" base64 encoded
        assert!(res2.is_err());

        // Valid base64 but not encrypted data (longer string)
        let res3 = decrypt_value("SGVsbG8gd29ybGQ="); // "Hello world" base64 encoded
        assert!(res3.is_err());
    }

    #[test]
    fn test_tamper_detection() {
        let original = "secret_password";
        let encrypted = encrypt_value(original).unwrap();

        // Modify one character in the base64 string
        let mut tampered = encrypted.clone();
        if tampered.len() > 10 {
            let last_char = tampered.pop().unwrap();
            let new_char = if last_char == 'A' { 'B' } else { 'A' };
            tampered.push(new_char);
        }

        let result = decrypt_value(&tampered);
        // Should fail because AES-GCM tags won't match or base64 decoding might fail if we hit padding
        assert!(result.is_err());
    }
}
