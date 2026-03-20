using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;

public class ImageSwitcher : MonoBehaviour
{
    public Image displayImage;
    public Sprite[] images;

    public string nextSceneName;   // 👈 set from Inspector

    private int currentIndex = 0;

    public void ShowNextImage()
    {
        if (images.Length == 0)
            return;

        // If last image → go to next scene
        if (currentIndex >= images.Length - 1)
        {
            if (!string.IsNullOrEmpty(nextSceneName))
            {
                SceneManager.LoadScene(nextSceneName);
            }
            return;
        }

        // Otherwise show next image
        currentIndex++;
        displayImage.sprite = images[currentIndex];
    }
}