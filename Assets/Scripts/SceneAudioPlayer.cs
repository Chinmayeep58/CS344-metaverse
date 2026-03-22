using UnityEngine;

[RequireComponent(typeof(AudioSource))]
public class SceneAudioPlayer : MonoBehaviour
{
    private AudioSource audioSource;

    void Start()
    {
        audioSource = GetComponent<AudioSource>();

        audioSource.loop = true;   // 🔁 Keep repeating
        audioSource.Play();        // ▶ Start playing
    }
}