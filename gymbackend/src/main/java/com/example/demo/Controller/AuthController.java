package com.example.demo.Controller;

import com.example.demo.Dto.LoginRequest;
import com.example.demo.Dto.LoginResponse;
import com.example.demo.Dto.RegisterRequest;
import com.example.demo.Entity.User;
import com.example.demo.Repository.UserRepository;
import com.example.demo.Service.UserService;
import com.example.demo.Security.JwtService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

        private final AuthenticationManager authenticationManager;
        private final UserRepository userRepository;
        private final UserService userService;
        private final JwtService jwtService;
        public AuthController(
                        AuthenticationManager authenticationManager,
                        UserRepository userRepository,
                        UserService userService,
                        JwtService jwtService) {

                this.authenticationManager = authenticationManager;
                this.userRepository = userRepository;
                this.userService = userService;
                this.jwtService = jwtService;
        }

        @PostMapping("/register")
        public ResponseEntity<?> register(
                        @RequestBody RegisterRequest registerRequest) {

                if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
                        return ResponseEntity.badRequest()
                                        .body("Email already exists");
                }

                if (userRepository.count() > 0) {
                        return ResponseEntity.badRequest()
                                        .body("Registration is already closed");
                }

                User user = new User();

                user.setName(registerRequest.getName());
                user.setEmail(registerRequest.getEmail());
                user.setPassword(registerRequest.getPassword());
                user.setRole("ADMIN");

                User savedUser = userService.createUser(user);

                return ResponseEntity.ok("Admin registered successfully");
        }

        @PostMapping("/login")
        public ResponseEntity<LoginResponse> login(
                        @RequestBody LoginRequest loginRequest) {

                authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                loginRequest.getEmail(),
                                                loginRequest.getPassword()));

                User user = userRepository.findByEmail(loginRequest.getEmail())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                String token = jwtService.generateToken(user.getEmail());

                LoginResponse response = new LoginResponse(
                                token,
                                user.getName(),
                                user.getEmail(),
                                user.getRole());

                return ResponseEntity.ok(response);
        }

}