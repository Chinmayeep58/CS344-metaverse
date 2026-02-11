using UnityEngine;
using TMPro;
using UnityEngine.SceneManagement;
using System.Security.Cryptography;
using System.Text;

public class AuthManager : MonoBehaviour
{
    [Header("UI")]
    public TMP_InputField emailInput;
    public TMP_InputField passwordInput;
    public TMP_Text messageText;

    private const string EMAIL_KEY = "USER_EMAIL";
    private const string PASSWORD_KEY = "USER_PASSWORD_HASH";

    void Start()
    {
        messageText.text = "Hello";
    }

    // 🔘 SINGLE BUTTON ENTRY POINT
    public void Submit()
    {
        if (!ValidateInput()) return;

        if (!PlayerPrefs.HasKey(EMAIL_KEY))
        {
            // 🆕 New user
            RegisterUser();
        }
        else
        {
            // 👤 Existing user
            LoginUser();
        }
    }

    void RegisterUser()
    {
        string passwordHash = HashPassword(passwordInput.text);

        PlayerPrefs.SetString(EMAIL_KEY, emailInput.text);
        PlayerPrefs.SetString(PASSWORD_KEY, passwordHash);
        PlayerPrefs.Save();

        messageText.text = "Welcome! Setting up your account...";
        SceneManager.LoadScene("EQ_Scene1"); // or HomeScene
    }

    void LoginUser()
    {
        string storedEmail = PlayerPrefs.GetString(EMAIL_KEY);
        string storedPasswordHash = PlayerPrefs.GetString(PASSWORD_KEY);

        if (emailInput.text != storedEmail)
        {
            messageText.text = "Email not found";
            return;
        }

        if (HashPassword(passwordInput.text) != storedPasswordHash)
        {
            messageText.text = "Incorrect password";
            return;
        }

        messageText.text = "Welcome back!";
        SceneManager.LoadScene("EQ_Scene1");
    }

    bool ValidateInput()
    {
        if (string.IsNullOrEmpty(emailInput.text) ||
            string.IsNullOrEmpty(passwordInput.text))
        {
            messageText.text = "Email and password required";
            return false;
        }

        if (!emailInput.text.Contains("@"))
        {
            messageText.text = "Invalid email format";
            return false;
        }

        if (passwordInput.text.Length < 6)
        {
            messageText.text = "Password must be 6+ characters";
            return false;
        }

        return true;
    }

    string HashPassword(string password)
    {
        using (SHA256 sha = SHA256.Create())
        {
            byte[] bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
            StringBuilder builder = new StringBuilder();

            foreach (byte b in bytes)
                builder.Append(b.ToString("x2"));

            return builder.ToString();
        }
    }
}
