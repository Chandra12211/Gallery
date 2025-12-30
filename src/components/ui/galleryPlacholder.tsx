import React from 'react'

const galleryPlacholder = () => {
    return (
        <div className="placeholder-grid">
            {[...Array(12)].map((_, index) => {
                const heights = [300, 350, 280, 400, 320, 360, 290, 380, 310, 340, 300, 370];
                const height = heights[index % heights.length];

                return (
                    <div
                        key={index}
                        className="placeholder-item" 
                    >
                        <div className="placeholder-card">
                            <div
                                className="placeholder-image"
                                style={{ minHeight: `${height}px` }}
                            />

                            <div className="placeholder-footer">
                                <div className="placeholder-footer-content">
                                    <div className="placeholder-line placeholder-line-wide" />
                                    <div className="placeholder-line placeholder-line-narrow" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    )
}

export default galleryPlacholder