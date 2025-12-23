import { Injectable, inject } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, doc, getDoc, setDoc, updateDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { environment } from '../../../environments/environment';

/**
 * Service for Firebase Firestore operations
 * Handles note content storage and real-time updates
 */
@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app: FirebaseApp;
  private firestore: Firestore;

  constructor() {
    // Initialize Firebase
    this.app = initializeApp(environment.firebase);
    this.firestore = getFirestore(this.app);
  }

  /**
   * Get note content from Firestore
   * @param noteId - Note ID (firebase_document_id)
   * @returns Promise with note content
   */
  async getNoteContent(noteId: string): Promise<string> {
    try {
      const noteRef = doc(this.firestore, 'notes', noteId);
      const noteSnap = await getDoc(noteRef);
      
      if (noteSnap.exists()) {
        return noteSnap.data()['content'] || '';
      }
      return '';
    } catch (error) {
      console.error('Error getting note content from Firebase:', error);
      return '';
    }
  }

  /**
   * Save note content to Firestore
   * @param noteId - Note ID (firebase_document_id)
   * @param content - Note content (HTML)
   * @returns Promise<void>
   */
  async saveNoteContent(noteId: string, content: string): Promise<void> {
    try {
      const noteRef = doc(this.firestore, 'notes', noteId);
      await setDoc(noteRef, {
        content: content,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving note content to Firebase:', error);
      throw error;
    }
  }

  /**
   * Update note content in Firestore
   * @param noteId - Note ID (firebase_document_id)
   * @param content - Note content (HTML)
   * @returns Promise<void>
   */
  async updateNoteContent(noteId: string, content: string): Promise<void> {
    try {
      const noteRef = doc(this.firestore, 'notes', noteId);
      await updateDoc(noteRef, {
        content: content,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating note content in Firebase:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time updates for note content
   * @param noteId - Note ID (firebase_document_id)
   * @param callback - Callback function to handle content updates
   * @returns Unsubscribe function
   */
  subscribeToNoteContent(noteId: string, callback: (content: string) => void): Unsubscribe {
    const noteRef = doc(this.firestore, 'notes', noteId);
    
    return onSnapshot(noteRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback(data['content'] || '');
      } else {
        callback('');
      }
    }, (error) => {
      console.error('Error subscribing to note content:', error);
      callback('');
    });
  }

  /**
   * Delete note content from Firestore
   * @param noteId - Note ID (firebase_document_id)
   * @returns Promise<void>
   */
  async deleteNoteContent(noteId: string): Promise<void> {
    try {
      const noteRef = doc(this.firestore, 'notes', noteId);
      await setDoc(noteRef, {
        content: '',
        deletedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Error deleting note content from Firebase:', error);
      throw error;
    }
  }
}

