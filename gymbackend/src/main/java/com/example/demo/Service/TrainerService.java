package com.example.demo.Service;

import com.example.demo.Dto.CreateTrainerRequest;
import com.example.demo.Entity.Trainer;
import com.example.demo.Entity.User;
import com.example.demo.Entity.Member;
import com.example.demo.Dto.TrainerOption;
import com.example.demo.Repository.MemberRepository;
import com.example.demo.Repository.TrainerRepository;
import com.example.demo.Repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class TrainerService {

    private final TrainerRepository trainerRepository;
    private final MemberRepository memberRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    public TrainerService(
            TrainerRepository trainerRepository,
            MemberRepository memberRepository,
            UserRepository userRepository,
            UserService userService) {
        this.trainerRepository = trainerRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    public List<Trainer> getAllTrainers() {
        return trainerRepository.findAll();
    }

    public Optional<Trainer> getTrainerById(Long id) {
        return trainerRepository.findById(id);
    }

    public List<TrainerOption> getActiveTrainerOptions() {
        return trainerRepository.findByStatusIgnoreCase("Active").stream()
                .map(trainer -> new TrainerOption(trainer.getId(), trainer.getName()))
                .toList();
    }

    @Transactional
    public Trainer createTrainer(CreateTrainerRequest request) {
        String email = request.getEmail().trim();

        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }

        Trainer trainer = trainerRepository.findByEmail(email)
                .orElseGet(Trainer::new);
        boolean isNewTrainer = trainer.getId() == null;
        trainer.setName(request.getName().trim());
        trainer.setSpecialization(request.getSpecialization().trim());
        trainer.setExperience(request.getExperience().toString());
        trainer.setPhone(request.getPhone().trim());
        trainer.setEmail(email);
        trainer.setStatus(request.getStatus() == null || request.getStatus().isBlank()
                ? "Active"
                : request.getStatus());
        if (isNewTrainer) {
            trainer.setAssignedMembers(0);
        }

        User trainerUser = new User();
        trainerUser.setName(trainer.getName());
        trainerUser.setEmail(email);
        trainerUser.setPassword(request.getPassword());
        trainerUser.setRole("TRAINER");

        userService.createUser(trainerUser);
        return trainerRepository.save(trainer);
    }

    @Transactional
    public Trainer updateTrainer(Long id, Trainer trainer) {

        Trainer existingTrainer = trainerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trainer not found"));

        String previousEmail = existingTrainer.getEmail();
        String updatedEmail = trainer.getEmail();
        if (updatedEmail != null && !updatedEmail.equalsIgnoreCase(previousEmail)) {
            userRepository.findByEmail(previousEmail)
                    .filter(user -> "TRAINER".equalsIgnoreCase(user.getRole()))
                    .ifPresent(user -> {
                        if (userRepository.findByEmail(updatedEmail).isPresent()) {
                            throw new IllegalArgumentException("Email already exists");
                        }
                        user.setEmail(updatedEmail);
                        user.setName(trainer.getName());
                        userRepository.save(user);
                    });
        } else {
            userRepository.findByEmail(previousEmail)
                    .filter(user -> "TRAINER".equalsIgnoreCase(user.getRole()))
                    .ifPresent(user -> user.setName(trainer.getName()));
        }

        existingTrainer.setName(trainer.getName());
        existingTrainer.setSpecialization(trainer.getSpecialization());
        existingTrainer.setExperience(trainer.getExperience());
        existingTrainer.setPhone(trainer.getPhone());
        existingTrainer.setEmail(trainer.getEmail());
        existingTrainer.setStatus(trainer.getStatus());

        return trainerRepository.save(existingTrainer);
    }

    @Transactional
    public void deleteTrainer(Long id) {

        Trainer trainer = trainerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trainer not found"));

        List<Member> assignedMembers = memberRepository.findAllByTrainer_Id(id);
        assignedMembers.forEach(member -> member.setTrainer(null));
        memberRepository.saveAll(assignedMembers);

        userRepository.findByEmail(trainer.getEmail())
                .filter(user -> "TRAINER".equalsIgnoreCase(user.getRole()))
                .ifPresent(user -> userRepository.delete(user));
        trainerRepository.deleteById(id);
    }
}