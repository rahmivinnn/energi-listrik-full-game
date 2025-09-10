using UnityEngine;

public interface IInteractable
{
    void Interact();
    string GetInteractionText();
}

public class ElectricalComponent : MonoBehaviour, IInteractable
{
    [Header("Component Settings")]
    public string componentName;
    public bool isActive = false;
    public float voltage = 0f;
    public float current = 0f;
    public float resistance = 1f;
    
    [Header("Visual Feedback")]
    public GameObject activeIndicator;
    public Material activeMaterial;
    public Material inactiveMaterial;
    public Renderer componentRenderer;
    
    [Header("Audio")]
    public AudioSource audioSource;
    public AudioClip activationSound;
    public AudioClip deactivationSound;
    
    [Header("UI")]
    public GameObject infoPanel;
    public Text infoText;
    
    private bool isPlayerNearby = false;
    
    void Start()
    {
        UpdateVisuals();
        if (infoPanel != null)
            infoPanel.SetActive(false);
    }
    
    void Update()
    {
        // Check if player is nearby
        GameObject player = GameObject.FindGameObjectWithTag("Player");
        if (player != null)
        {
            float distance = Vector3.Distance(transform.position, player.transform.position);
            isPlayerNearby = distance <= 3f;
            
            if (infoPanel != null)
                infoPanel.SetActive(isPlayerNearby);
        }
        
        UpdateInfo();
    }
    
    public void Interact()
    {
        ToggleComponent();
    }
    
    public string GetInteractionText()
    {
        return "Tekan E untuk " + (isActive ? "mematikan" : "menyalakan") + " " + componentName;
    }
    
    public void ToggleComponent()
    {
        isActive = !isActive;
        UpdateVisuals();
        PlaySound();
        
        // Notify other components
        BroadcastMessage("OnComponentStateChanged", isActive, SendMessageOptions.DontRequireReceiver);
    }
    
    public void SetActive(bool active)
    {
        isActive = active;
        UpdateVisuals();
    }
    
    void UpdateVisuals()
    {
        if (componentRenderer != null)
        {
            componentRenderer.material = isActive ? activeMaterial : inactiveMaterial;
        }
        
        if (activeIndicator != null)
        {
            activeIndicator.SetActive(isActive);
        }
    }
    
    void PlaySound()
    {
        if (audioSource != null)
        {
            AudioClip clipToPlay = isActive ? activationSound : deactivationSound;
            if (clipToPlay != null)
            {
                audioSource.PlayOneShot(clipToPlay);
            }
        }
    }
    
    void UpdateInfo()
    {
        if (infoText != null)
        {
            infoText.text = $"{componentName}\n" +
                          $"Status: {(isActive ? "Aktif" : "Tidak Aktif")}\n" +
                          $"Tegangan: {voltage:F1}V\n" +
                          $"Arus: {current:F1}A\n" +
                          $"Hambatan: {resistance:F1}Ω";
        }
    }
    
    public void OnComponentStateChanged(bool newState)
    {
        // Override this method in child classes for specific behavior
    }
}
