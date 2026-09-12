import { useState, useEffect, useCallback, use } from "react";
import { supabase } from '../supabaseClient'; 

import "./Gallery.css"; 


export default function Gallery ({session, profile}) {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(true); 

  const [lightboxIndex, setLightboxIndex] = useState(null);
  
  //Fetch photos and create signed URLs for private viewing
  const fetchPhotos = async () => {
    try {
     const {data, error} = await supabase
         .from("photos")
         .select("id, storage_path, caption, profiles(username)")
         .order("created_at", {ascending: false});  

     if (!error && data) {
      const photosWithURLs = await Promise.all(
        data.map(async (item) => {
          const {data: urlData} = await supabase.storage
               .from("event-photos")
               .createSignedUrl(item.storage_path, 3600); 

          return {
            ...item, 
            url: urlData?.signedUrl,
            uploader: item.profiles?.username
          };      
        })
      );

      setPhotos(photosWithURLs); 
    }   

    } catch (err) {
      console.error("Error fetching photos: ", err);

    } finally {
      setLoadingPhotos(false); 
    }
  };
   
  useEffect(() => {
    fetchPhotos();
  }, []); 


  //Slideshow navigation handlers
  const handlePrev = useCallback(() => {
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1)); 
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setLightboxIndex((prev) => (prev < photos.length ? prev + 1 : 0)); 
  }, [photos.length]);

  const handleClose = useCallback(() => {
    setLightboxIndex(null);
  });

  //Slideshow keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown); 
  }, [lightboxIndex, handlePrev, handleNext, handleClose]);


  const handleUpload = async (e) => {
    try {
     setUploading(true);
     const files = Array.from(e.target.files || []);  
     if (files.length === 0) return;  
     
     //Upload all files and insert DB records in parallel
     await Promise.all(
       files.map(async (file, index) => {
        const fileExt = file.name.split('.').pop(); 

        //Append index and random suffix to avoid file name collision in batch
        const filePath = `${session.user.id}/${Date.now()}.${fileExt}`; 

        //Upload to private bucket
        const {error: storageError} = await supabase.storage
             .from("event-photos")
             .upload(filePath, file); 

        if (storageError) throw storageError;     

        //Insert record linked to current user 
        const {error: dbError} = await supabase.from("photos").insert([
          {
            storage_path: filePath, 
            caption: file.name,
            user_id: session.user.id
          }
        ]);

        if (dbError) throw dbError; 
       })
     );

     fetchPhotos();

    } catch (err) {
      alert(err.message); 

    } finally {
      setUploading(false); 
      e.target.value = ""; 
    }
  }; 


  return(
    <div className="gallery-container">
      <header className="gallery-header">
        
        <div>
          <h1 className="gallery-title">Preveza photos</h1>
          <p className="gallery-user-username">Logged in as <strong>{profile?.username}</strong></p>
        </div>

        <button
         className="signout-btn"
         onClick={() => supabase.auth.signOut()}
        >
          Sign Out
        </button>
      </header>

      {/*Upload Button*/}
      <section className="upload-card">
        <label className={`upload-label ${uploading ? 'disabled' : ''}`}>
          <span>{uploading ? "Uploading..." : "+ Choose photos to upload"}</span>
          <span className="upload-subtext">.jpg .png .webp</span>

          <input
           type="file"
           accept="image/*"
           multiple
           onChange={handleUpload}
           disabled={uploading}
           style= {{display: "none"}}          
          />
        </label>
      </section>

      {/*Image Grid*/}
      <section className="photo-grid">
        {photos.map((photo, index) => (
          <div className="photo-item" key={photo.id} onClick={() => setLightboxIndex(index)}>
           <img 
            className="photo-img"
            src={photo.url}
            alt={photo.caption}
            loading="lazy"
           />

           <div className="photo-overlay">
             <span className="photo-uploader">Uploaded by <strong>{photo.uploader}</strong></span>
           </div>
          </div>
        ))}
      </section>

      {/*Slideshow Modal*/}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div className="lightbox-backdrop">
          <div className="lightbox-content">
            <button className="lightbox-close-btn" onClick={handleClose} aria-label="Close">
              &times; 
            </button>

            {photos.length > 1 && (
              <>
                <button className="lightbox-nav-btn prev" onClick={handlePrev} aria-label="Previous Photo">
                  &#10094;
                </button>

                <button className="lightbox-nav-btn next" onClick={handleNext} aria-label="Next Photo">
                  &#10095;
                </button>
              </>
            )}

            <img 
             className="lightbox-img"
             src={photos[lightboxIndex].url}
             alt={photos[lightboxIndex].caption}
            />

            <div className="lightbox-details">
              <span className="lightbox-counter">{lightboxIndex + 1} / {photos.length}</span>
              <span className="lightbox-caption">{photos[lightboxIndex].caption}</span>
              <span className="lightbox-uploader">Uploaded by {photos[lightboxIndex].uploader}</span>
            </div>

          </div>
        </div>
      )}

      {photos.length === 0 && !loadingPhotos && (
        <p className="empty-gallery">
          No photos yet. Upload your first memory! 
        </p>
      )}

      {loadingPhotos && <p className="loading-text">Loading photos...</p>}
    </div>
  );  
}
