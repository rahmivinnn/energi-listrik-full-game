using UnityEngine;

public class PlayerController : MonoBehaviour
{
    [Header("Movement Settings")]
    public float walkSpeed = 5f;
    public float runSpeed = 8f;
    public float jumpForce = 8f;
    public float mouseSensitivity = 2f;
    
    [Header("Camera Settings")]
    public Camera playerCamera;
    public float cameraDistance = 2f;
    public float cameraHeight = 1.5f;
    
    [Header("Ground Check")]
    public Transform groundCheck;
    public float groundDistance = 0.4f;
    public LayerMask groundMask;
    
    [Header("Interaction")]
    public float interactionRange = 3f;
    public LayerMask interactableMask;
    
    private CharacterController controller;
    private Vector3 velocity;
    private bool isGrounded;
    private float xRotation = 0f;
    private bool isRunning = false;
    
    void Start()
    {
        controller = GetComponent<CharacterController>();
        
        if (playerCamera == null)
            playerCamera = Camera.main;
            
        // Lock cursor to center of screen
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
    }
    
    void Update()
    {
        HandleMovement();
        HandleMouseLook();
        HandleJump();
        HandleInteraction();
        HandleRunning();
    }
    
    void HandleMovement()
    {
        // Check if grounded
        isGrounded = Physics.CheckSphere(groundCheck.position, groundDistance, groundMask);
        
        if (isGrounded && velocity.y < 0)
        {
            velocity.y = -2f;
        }
        
        // Get input
        float x = Input.GetAxis("Horizontal");
        float z = Input.GetAxis("Vertical");
        
        // Calculate movement direction
        Vector3 move = transform.right * x + transform.forward * z;
        
        // Apply speed
        float currentSpeed = isRunning ? runSpeed : walkSpeed;
        controller.Move(move * currentSpeed * Time.deltaTime);
        
        // Apply gravity
        velocity.y += Physics.gravity.y * Time.deltaTime;
        controller.Move(velocity * Time.deltaTime);
    }
    
    void HandleMouseLook()
    {
        // Get mouse input
        float mouseX = Input.GetAxis("Mouse X") * mouseSensitivity;
        float mouseY = Input.GetAxis("Mouse Y") * mouseSensitivity;
        
        // Rotate player body
        transform.Rotate(Vector3.up * mouseX);
        
        // Rotate camera
        xRotation -= mouseY;
        xRotation = Mathf.Clamp(xRotation, -90f, 90f);
        playerCamera.transform.localRotation = Quaternion.Euler(xRotation, 0f, 0f);
    }
    
    void HandleJump()
    {
        if (Input.GetButtonDown("Jump") && isGrounded)
        {
            velocity.y = Mathf.Sqrt(jumpForce * -2f * Physics.gravity.y);
        }
    }
    
    void HandleRunning()
    {
        isRunning = Input.GetKey(KeyCode.LeftShift);
    }
    
    void HandleInteraction()
    {
        if (Input.GetKeyDown(KeyCode.E))
        {
            RaycastHit hit;
            if (Physics.Raycast(playerCamera.transform.position, playerCamera.transform.forward, out hit, interactionRange, interactableMask))
            {
                IInteractable interactable = hit.collider.GetComponent<IInteractable>();
                if (interactable != null)
                {
                    interactable.Interact();
                }
            }
        }
    }
    
    void OnDrawGizmosSelected()
    {
        // Draw ground check sphere
        Gizmos.color = Color.red;
        Gizmos.DrawWireSphere(groundCheck.position, groundDistance);
        
        // Draw interaction range
        Gizmos.color = Color.blue;
        Gizmos.DrawRay(playerCamera.transform.position, playerCamera.transform.forward * interactionRange);
    }
}
