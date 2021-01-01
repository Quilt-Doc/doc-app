for f in $(git rev-list -n 2 --all --date=iso --format=%H%n%cd%n%T%n%an%n%cn%n%ce%n%s%n%P$%n%D);
do git show -M --numstat --name-status --format=%H%n%cd%n%T%n%an%n%cn%n%ce%n%s%n%P$%n%D%nEND%n
done
