using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;

public class ImageSwitcherAuto : MonoBehaviour
{
    public Image displayImage;
    public Sprite[] images;

    public string nextSceneName;

    public float delay = 3f; // ⏱ time between images

    private int currentIndex = 0;

    void Start()
    {
        if (images.Length > 0)
        {
            displayImage.sprite = images[0];
            InvokeRepeating(nameof(ShowNextImage), delay, delay);
        }
    }

    void ShowNextImage()
    {
        // If last image → go to next scene
        if (currentIndex >= images.Length - 1)
        {
            CancelInvoke();

            if (!string.IsNullOrEmpty(nextSceneName))
            {
                SceneManager.LoadScene(nextSceneName);
            }
            return;
        }

        // Show next image
        currentIndex++;
        displayImage.sprite = images[currentIndex];
    }
}