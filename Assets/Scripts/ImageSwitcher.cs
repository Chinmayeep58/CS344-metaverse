using UnityEngine;
using UnityEngine.UI;

public class ImageSwitcher : MonoBehaviour
{
    public Image displayImage;     // The UI Image component
    public Sprite[] images;        // Array of images

    private int currentIndex = 0;

    public void ShowNextImage()
    {
        if (images.Length == 0)
            return;

        currentIndex++;

        if (currentIndex >= images.Length)
            currentIndex = 0;   // Loop back to first image

        displayImage.sprite = images[currentIndex];
    }
}
